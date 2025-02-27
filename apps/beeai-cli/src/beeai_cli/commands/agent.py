# Copyright 2025 IBM Corp.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json
import sys

import typer
from click import BadParameter
from rich.table import Column

from acp import types, ServerNotification, RunAgentResult, McpError, ErrorData
from acp.types import AgentRunProgressNotification, AgentRunProgressNotificationParams, Agent
from beeai_cli.api import send_request, send_request_with_notifications
from beeai_cli.async_typer import AsyncTyper, console, err_console, create_table
from beeai_cli.utils import check_json

app = AsyncTyper()


@app.command("run")
async def run(
    name: str = typer.Argument(help="Name of the agent to call"),
    input: str = typer.Argument(... if sys.stdin.isatty() else sys.stdin.read(), help="Agent input as text or JSON"),
) -> None:
    """Call an agent with a given input."""
    try:
        input = check_json(input)
    except BadParameter:
        agent = await _get_agent(name)
        required_input_properties = set(agent.inputSchema.get("required", []))
        if required_input_properties == {"text"}:
            input = {"text": input}
        elif required_input_properties == {"messages"}:
            input = {"messages": [{"role": "user", "content": input}]}
        else:
            raise ValueError(
                f"Agent {name} does not support plaintext input, "
                f"please provide a json input with this schema:\n{json.dumps(agent.inputSchema, indent=2)}"
            )

    last_was_stream = False
    async for message in send_request_with_notifications(
        types.RunAgentRequest(method="agents/run", params=types.RunAgentRequestParams(name=name, input=input)),
        types.RunAgentResult,
    ):
        match message:
            case ServerNotification(
                root=AgentRunProgressNotification(params=AgentRunProgressNotificationParams(delta=delta))
            ):
                for log in list(filter(bool, delta.get("logs", []))):
                    if text := log.get("message", None):
                        if last_was_stream:
                            err_console.print()
                        err_console.print(f"Log: {text.strip()}", style="dim")
                        last_was_stream = False
                if text := delta.get("text", None):
                    console.print(text, end="")
                    last_was_stream = True
                elif messages := delta.get("messages", None):
                    console.print(messages[-1]["content"], end="")
                    last_was_stream = True
                elif not delta.get("logs", None):
                    last_was_stream = True
                    console.print(delta)
            case RunAgentResult() as result:
                if not last_was_stream:
                    if text := result.model_dump().get("output", {}).get("text", None):
                        console.print(text)
                    else:
                        console.print(result)
                else:
                    console.print()


@app.command("list")
async def list_agents():
    """List available agents"""
    result = await send_request(types.ListAgentsRequest(method="agents/list"), types.ListAgentsResult)
    extra_cols = ["ui"]
    with create_table(Column("Name", style="yellow"), *extra_cols, Column("Description", ratio=1)) as table:
        for agent in result.agents:
            table.add_row(
                agent.name,
                *[str(agent.model_extra.get(col, "<none>")) for col in extra_cols],
                agent.description,
            )
    console.print(table)


async def _get_agent(name: str) -> Agent:
    result = await send_request(types.ListAgentsRequest(method="agents/list"), types.ListAgentsResult)
    agents_by_name = {agent.name: agent for agent in result.agents}
    if agent := agents_by_name.get(name, None):
        return agent
    raise McpError(error=ErrorData(code=404, message=f"agent/{name} not found in any provider"))


@app.command("info")
async def agent_detail(
    name: str = typer.Argument(help="Name of agent tool to show"),
):
    """Show details of an agent"""
    console.print(await _get_agent(name))

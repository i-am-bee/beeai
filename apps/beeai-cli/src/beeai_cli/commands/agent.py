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
from acp import types, ServerNotification, RunAgentResult
from acp.types import AgentRunProgressNotification, AgentRunProgressNotificationParams
from rich.table import Table

from beeai_cli.api import send_request, send_request_with_notifications
from beeai_cli.async_typer import AsyncTyper, console
from beeai_cli.utils import format_model

app = AsyncTyper()


@app.command("run")
async def run(
    name: str = typer.Argument(help="Name of the tool to call"),
    input: str = typer.Argument(help="Agent input as JSON"),
) -> None:
    """Call a tool with given input."""
    try:
        parsed_input = json.loads(input)
    except json.JSONDecodeError:
        typer.echo("Input must be valid JSON")
        return

    text_streamed = False
    async for message in send_request_with_notifications(
        types.RunAgentRequest(method="agents/run", params=types.RunAgentRequestParams(name=name, input=parsed_input)),
        types.RunAgentResult,
    ):
        match message:
            case ServerNotification(
                root=AgentRunProgressNotification(params=AgentRunProgressNotificationParams(delta=delta))
            ):
                for log in filter(bool, delta.get("logs", [])):
                    if text := log.get("text", None):
                        typer.echo(f"Log: {text.strip()}", file=sys.stderr)

                if text := delta.get("text", None):
                    typer.echo(text, nl=False)
                    text_streamed = True
            case RunAgentResult() as result:
                if not text_streamed:
                    typer.echo(format_model(result))
                else:
                    typer.echo()


@app.command("list")
async def list_agents():
    result = await send_request(types.ListAgentsRequest(method="agents/list"), types.ListAgentsResult)
    extra_cols = list({col for agent in result.agents for col in agent.model_extra if col != "fullDescription"})
    table = Table("Name", "Description", *extra_cols, expand=True, show_lines=True)
    for agent in result.agents:
        table.add_row(agent.name, agent.description, *[str(agent.model_extra.get(col, "")) for col in extra_cols])
    console.print(table)

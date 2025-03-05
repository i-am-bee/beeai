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

import contextlib
import json
from enum import StrEnum

from prompt_toolkit.completion import NestedCompleter, Completer

try:
    # This is necessary for proper handling of arrow keys in interactive input
    import gnureadline as readline  # noqa: F401
except ImportError:
    import readline  # noqa: F401

import sys
from pathlib import Path
from typing import Any, Optional

import jsonschema
import rich.json
import typer
from acp import ErrorData, McpError, RunAgentResult, ServerNotification, types
from acp.types import Agent, AgentRunProgressNotification, AgentRunProgressNotificationParams
from beeai_sdk.schemas.metadata import UiType
from click import BadParameter
from rich.markdown import Markdown
from rich.table import Column
from rich.text import Text

from beeai_cli.api import send_request, send_request_with_notifications
from beeai_cli.async_typer import AsyncTyper, console, create_table, err_console
from beeai_cli.utils import check_json, generate_schema_example, omit, prompt_user

app = AsyncTyper()


async def _run_agent(name: str, input: dict[str, Any], dump_files_path: Path | None = None) -> RunAgentResult:
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
                output_dict: dict = result.model_dump().get("output", {})
                console.print(output_dict.get("text", result) if not last_was_stream else "")

                if dump_files_path is not None and (files := output_dict.get("files", {})):
                    files: dict[str, str]
                    dump_files_path.mkdir(parents=True, exist_ok=True)

                    for file_path, content in files.items():
                        full_path = dump_files_path / file_path
                        with contextlib.suppress(ValueError):
                            full_path.resolve().relative_to(dump_files_path.resolve())  # throws if outside folder
                            full_path.parent.mkdir(parents=True, exist_ok=True)
                            full_path.write_text(content)

                    console.print(f"📁 Saved {len(files)} files to {dump_files_path}.")

                return result
    raise RuntimeError(f"Agent {name} did not produce a result")


class Command(StrEnum):
    quit = "q"
    set = "set"
    show_config = "show-config"
    help = "?"


def _handle_command(command: str, config_schema: dict[str, Any] | None, config: dict[str, Any]):
    [args_str] = command.split(" ", maxsplit=1)[1:] or [None]
    match command.split(" ", maxsplit=1):
        case [Command.set, *_rest]:
            if not args_str:
                raise ValueError("Please provide a config key to update")
            key, value = args_str.split(" ", maxsplit=1)
            if not config_schema:
                raise ValueError("This agent can't be configured")
            if key not in config_schema["properties"]:
                raise ValueError(f"Unknown option {key}")
            try:
                if value.strip("\"'") == value and not value.startswith("{") and not value.startswith("["):
                    value = f'"{value}"'
                json_value = json.loads(value)
                tmp_config = {**config, key: json_value}
                jsonschema.validate(tmp_config, config_schema)
                config[key] = json_value
                console.print("Config:", config)
            except json.JSONDecodeError:
                raise ValueError(f"The provided value cannot be parsed into JSON: {value}")
            except jsonschema.ValidationError as ex:
                err_console.print(json.dumps(generate_schema_example(config_schema["properties"][key])))
                raise ValueError(f"Invalid value for key {key}: {ex}")
        case [Command.show_config]:
            if not config_schema:
                console.print("This agent can't be configured")
            console.print(Markdown("## Configuration schema"))
            with create_table(Column("Key", ratio=1), Column("Type", ratio=3), Column("Example", ratio=2)) as table:
                for prop, schema in config_schema["properties"].items():
                    table.add_row(prop, json.dumps(schema), json.dumps(generate_schema_example(schema)))
            console.print(table)
            if config:
                console.print(Markdown("## Current configuration"))
                with create_table(Column("Key", ratio=1), Column("Value", ratio=5)) as table:
                    for key, value in config.items():
                        table.add_row(key, json.dumps(value))
                console.print(table)
        case [Command.help]:
            with create_table("command", "arguments", "description") as table:
                table.add_row("/q", "n/a", "Quit.")
                table.add_row("/?", "n/a", "Show this help.")
                table.add_row(
                    "/set", "<key> <value>", "Set agent configuration value. Use JSON syntax for more complex objects"
                )
                table.add_row("/show-config", "n/a", "Show available and currently set configuration options")
            console.print(table)

        case ["q"]:
            sys.exit(0)
        case _:
            raise ValueError(f"Invalid command: {command}")


def _create_completer(config_schema: dict[str, Any] | None = None) -> Completer:
    completions = {
        f"/{Command.help}": None,
        f"/{Command.quit}": None,
        f"/{Command.show_config}": None,
    }
    if config_schema:
        completions[f"/{Command.set}"] = {
            key: {json.dumps(generate_schema_example(schema))} for key, schema in config_schema["properties"].items()
        }
    return NestedCompleter.from_nested_dict(completions)


def _handle_input(config_schema: dict[str, Any] | None, config: dict[str, Any]) -> str:
    while True:
        try:
            input = prompt_user(completer=_create_completer(config_schema))
            if input.startswith("/"):
                _handle_command(input.lstrip("/"), config_schema, config)
                continue
            return input
        except ValueError as exc:
            err_console.print(str(exc))


@app.command("run")
async def run(
    name: str = typer.Argument(help="Name of the agent to call"),
    input: str = typer.Argument(
        None if sys.stdin.isatty() else sys.stdin.read(),
        help="Agent input as text or JSON",
    ),
    dump_files: Optional[Path] = typer.Option(None, help="Folder path to save any files returned by the agent"),
) -> None:
    """Call an agent with a given input."""
    agent = await _get_agent(name)
    ui = agent.model_extra.get("ui", {}) or {}
    ui_type = ui.get("type", None)
    user_greeting = ui.get("userGreeting", None) or "How can I help you?"
    config = {}
    if not input:
        if ui_type not in {UiType.chat, UiType.hands_off}:
            err_console.print(
                f"💥 [red][bold]Error[/red][/bold]: Agent {name} does not use any supported UIs.\n"
                f"Please use the agent according to the following examples and schema:"
            )
            err_console.print(_render_examples(agent))
            err_console.print(Markdown("## Schema"), "")
            err_console.print(_render_schema(agent.inputSchema))
            exit(1)
        console.print(Markdown(f"# {agent.name}  \n{agent.description}"))

        config_schema = agent.inputSchema.get("properties", {}).get("config", None)
        if not config_schema or "properties" not in config_schema:
            config_schema = None
        if config_schema:
            _handle_command("show-config", config_schema, config)

        console.print("\nRunning in interactive mode, use '/?' for help, [red]type '/q' to quit.[/red]", style="bold")
        if config_schema:
            console.print("Hint: Use /set <key> <value> to set an agent configuration property.")

        console.print()
        if ui_type == UiType.chat:
            messages = []
            console.print(f"🤖 Agent: {user_greeting}")
            input = _handle_input(config_schema, config)
            while True:
                messages.append({"role": "user", "content": input})
                console.print("\n🤖 Agent: ", end=None)
                result = await _run_agent(
                    name, {"messages": messages, **({"config": config} if config else {})}, dump_files_path=dump_files
                )
                if not (new_messages := result.output.get("messages", None)):
                    raise ValueError("Agent did not return messages in the output")
                if all([message["role"] == "assistant" for message in new_messages]):
                    messages.extend(new_messages)
                else:
                    messages = new_messages
                input = _handle_input(config_schema, config)

        if ui_type == UiType.hands_off:
            user_greeting = ui.get("userGreeting", None) or "Enter your instructions."
            console.print(f"🤖 {user_greeting}")
            input = _handle_input(config_schema, config)
            console.print("\n🤖 Agent:")
            await _run_agent(name, {"text": input, "config": config}, dump_files_path=dump_files)
    else:
        try:
            input = check_json(input)
        except BadParameter:
            if ui_type == UiType.hands_off:
                input = {"text": input}
            elif ui_type == UiType.chat:
                input = {"messages": [{"role": "user", "content": input}]}
            else:
                err_console.print(
                    f"💥 [red][bold]Error[/red][/bold]: Agent {name} does not support plaintext input. See the following examples and agent schema:"
                )
                err_console.print(_render_examples(agent))
                err_console.print(Markdown("## Schema"), "")
                err_console.print(_render_schema(agent.inputSchema))
                exit(1)
        await _run_agent(name, input, dump_files_path=dump_files)


@app.command("list")
async def list_agents():
    """List available agents"""
    result = await send_request(types.ListAgentsRequest(method="agents/list"), types.ListAgentsResult)
    with create_table(Column("Name", style="yellow"), "UI", Column("Description", ratio=1)) as table:
        for agent in result.agents:
            table.add_row(
                agent.name,
                agent.model_extra.get("ui", {}).get("type", None) or "<none>",
                agent.description,
            )
    console.print(table)


async def _get_agent(name: str) -> Agent:
    result = await send_request(types.ListAgentsRequest(method="agents/list"), types.ListAgentsResult)
    agents_by_name = {agent.name: agent for agent in result.agents}
    if agent := agents_by_name.get(name, None):
        return agent
    raise McpError(error=ErrorData(code=404, message=f"agent/{name} not found in any provider"))


def _render_schema(schema: dict[str, Any] | None):
    return "No schema provided." if not schema else rich.json.JSON.from_data(schema)


def _render_examples(agent: Agent):
    if not (examples := (agent.model_extra.get("examples", {}) or {}).get("cli", []) or []):
        return Text()
    md = "## Examples"
    for i, example in enumerate(examples):
        processing_steps = "\n".join(
            f"{i + 1}. {step}" for i, step in enumerate((example.get("processingSteps", []) or []))
        )
        name = example.get("name", None) or f"Example #{i + 1}"
        output = f"""
### Output
```
{example.get("output", "")}
```
"""
        md += f"""
### {name}
{example.get("description", None) or ""}

#### Command
```sh
{example["command"]}
```
{output if example.get("output", None) else ""}

#### Processing steps
{processing_steps}
"""

    return Markdown(md)


@app.command("info")
async def agent_detail(
    name: str = typer.Argument(help="Name of agent tool to show"),
    schema: bool | None = typer.Option(default=None),
):
    """Show details of an agent"""
    agent = await _get_agent(name)
    if schema:
        console.print(Markdown(f"# Agent {agent.name}\n## Input Schema\n"))
        console.print(_render_schema(agent.inputSchema))
        console.print(Markdown("## Output Schema\n"))
        console.print(_render_schema(agent.outputSchema))
        return

    agent_dict = agent.model_dump()
    basic_info = f"# {agent.name}\n{agent.description}"

    console.print(Markdown(basic_info))
    console.print(Markdown(agent_dict.get("fullDescription", None) or ""))
    console.print(_render_examples(agent))

    with create_table(Column("Key", ratio=1), Column("Value", ratio=5), title="Extra information") as table:
        for key, value in omit(
            agent.model_extra, {"fullDescription", "inputSchema", "outputSchema", "examples"}
        ).items():
            table.add_row(key, str(value))
    console.print()
    console.print(table)

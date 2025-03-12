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

import abc
import contextlib
import inspect
import json
import random

from beeai_cli.commands.env import ensure_llm_env
import jsonref
from prompt_toolkit.completion import NestedCompleter
from prompt_toolkit.validation import Validator
from rich.box import HORIZONTALS
from rich.console import ConsoleRenderable, Group, NewLine
from rich.panel import Panel
from rich.rule import Rule
from rich.text import Text
from rich.tree import Tree

try:
    # This is necessary for proper handling of arrow keys in interactive input
    import gnureadline as readline  # noqa: F401
except ImportError:
    import readline  # noqa: F401

import sys
from pathlib import Path
from typing import Any, Optional, Callable

import jsonschema
import rich.json
import typer
from acp import ErrorData, McpError, RunAgentResult, ServerNotification, types
from acp.types import Agent, AgentRunProgressNotification, AgentRunProgressNotificationParams
from beeai_sdk.schemas.metadata import UiType
from click import BadParameter
from rich.markdown import Markdown
from rich.table import Column

from beeai_cli.api import send_request, send_request_with_notifications
from beeai_cli.async_typer import AsyncTyper, console, create_table, err_console
from beeai_cli.utils import check_json, generate_schema_example, omit, prompt_user, filter_dict, remove_nullable

app = AsyncTyper()

processing_messages = [
    "Buzzing with ideas...",
    "Pollinating thoughts...",
    "Honey of an answer coming up...",
    "Swarming through data...",
    "Bee-processing your request...",
    "Hive mind activating...",
    "Making cognitive honey...",
    "Waggle dancing for answers...",
    "Bee right back...",
    "Extracting knowledge nectar...",
]


async def _run_agent(name: str, input: dict[str, Any], dump_files_path: Path | None = None) -> RunAgentResult:
    status = console.status(random.choice(processing_messages), spinner="dots")
    status.start()

    last_was_stream = False
    status_stopped = False

    async for message in send_request_with_notifications(
        types.RunAgentRequest(method="agents/run", params=types.RunAgentRequestParams(name=name, input=input)),
        types.RunAgentResult,
    ):
        if not status_stopped:
            status_stopped = True
            status.stop()
            console.print("🐝 Agent: ")

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
                if not last_was_stream:
                    if "text" in output_dict:
                        console.print(output_dict["text"], end="")
                    elif messages := output_dict.get("messages", None):
                        console.print(messages[-1]["content"], end="")
                    else:
                        console.print(result.model_dump())
                console.print("\n")
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


class InteractiveCommand(abc.ABC):
    args: list[str] = []
    command: str

    @abc.abstractmethod
    def handle(self, args_str: str | None = None): ...

    @property
    def enabled(self) -> bool:
        return True

    def completion_opts(self) -> dict[str, Any | None] | None:
        return None


class Quit(InteractiveCommand):
    """Quit"""

    command = "q"

    def handle(self, *_any):
        sys.exit(0)


class ShowConfig(InteractiveCommand):
    """Show available and currently set configuration options"""

    command = "show-config"

    def __init__(self, config_schema: dict[str, Any] | None, config: dict[str, Any]):
        self.config_schema = config_schema
        self.config = config

    @property
    def enabled(self) -> bool:
        return bool(self.config_schema)

    def handle(self, *_any):
        with create_table(Column("Key", ratio=1), Column("Type", ratio=3), Column("Example", ratio=2)) as schema_table:
            for prop, schema in self.config_schema["properties"].items():
                required_schema = remove_nullable(schema)
                schema_table.add_row(
                    prop,
                    json.dumps(required_schema),
                    json.dumps(generate_schema_example(required_schema)),
                )

        renderables = [
            NewLine(),
            Panel(schema_table, title="Configuration schema", title_align="left"),
        ]

        if self.config:
            with create_table(Column("Key", ratio=1), Column("Value", ratio=5)) as config_table:
                for key, value in self.config.items():
                    config_table.add_row(key, json.dumps(value))
            renderables += [
                NewLine(),
                Panel(config_table, title="Current configuration", title_align="left"),
            ]
        panel = Panel(
            Group(
                *renderables,
                NewLine(),
                console.render_str("[b]Hint[/b]: Use /set <key> <value> to set an agent configuration property."),
            ),
            title="Agent configuration",
            box=HORIZONTALS,
        )
        console.print(panel)


class Set(InteractiveCommand):
    """Set agent configuration value. Use JSON syntax for more complex objects"""

    args: list[str] = ["<key>", "<value>"]
    command = "set"

    def __init__(self, config_schema: dict[str, Any] | None, config: dict[str, Any]):
        self.config_schema = config_schema
        self.config = config

    @property
    def enabled(self) -> bool:
        return bool(self.config_schema)

    def handle(self, args_str: str | None = None):
        args_str = args_str or ""
        args = args_str.split(" ", maxsplit=1)
        if not args_str or len(args) != 2:
            raise ValueError(f"The command {self.command} takes exactly two arguments: <key> and <value>.")
        key, value = args
        if key not in self.config_schema["properties"]:
            raise ValueError(f"Unknown option {key}")
        try:
            if value.strip("\"'") == value and not value.startswith("{") and not value.startswith("["):
                value = f'"{value}"'
            json_value = json.loads(value)
            tmp_config = {**self.config, key: json_value}
            jsonschema.validate(tmp_config, self.config_schema)
            self.config[key] = json_value
            console.print("Config:", self.config)
        except json.JSONDecodeError:
            raise ValueError(f"The provided value cannot be parsed into JSON: {value}")
        except jsonschema.ValidationError as ex:
            err_console.print(json.dumps(generate_schema_example(self.config_schema["properties"][key])))
            raise ValueError(f"Invalid value for key {key}: {ex}")

    def completion_opts(self) -> dict[str, Any | None] | None:
        return {
            key: {json.dumps(generate_schema_example(schema))}
            for key, schema in self.config_schema["properties"].items()
        }


class Help(InteractiveCommand):
    """Show this help."""

    command = "?"

    def __init__(self, commands: list[InteractiveCommand]):
        self.commands = [self, *commands]

    def handle(self, *_any):
        with create_table("command", "arguments", "description") as table:
            for command in self.commands:
                table.add_row(f"/{command.command}", " ".join(command.args or ["n/a"]), inspect.getdoc(command))
        console.print(table)


def _create_input_handler(
    commands: list[InteractiveCommand],
    prompt: str | None = None,
    choice: list[str] | None = None,
    optional: bool = False,
) -> Callable:
    choice = choice or []
    commands = [cmd for cmd in commands if cmd.enabled]
    commands = [Quit(), *commands]
    commands = [Help(commands), *commands]
    commands_router = {f"/{cmd.command}": cmd for cmd in commands}
    completer = {
        **{f"/{cmd.command}": cmd.completion_opts() for cmd in commands},
        **{opt: None for opt in choice},
    }

    valid_options = set(choice) | commands_router.keys()

    def validate(text: str):
        if optional and not text:
            return True
        return text in valid_options if choice else bool(text)

    def handler():
        while True:
            try:
                input = prompt_user(
                    prompt=prompt,
                    completer=NestedCompleter.from_nested_dict(completer),
                    validator=Validator.from_callable(validate),
                    open_autocomplete_by_default=bool(choice),
                )
                if input.startswith("/"):
                    command, *arg_str = input.split(" ", maxsplit=1)
                    if command not in commands_router:
                        raise ValueError(f"Unknown command: {command}")
                    commands_router[command].handle(*arg_str)
                    continue
                return input
            except ValueError as exc:
                err_console.print(str(exc))
            except EOFError:
                raise KeyboardInterrupt

    return handler


def _setup_sequential_workflow(splash_screen: ConsoleRenderable, agents_by_name: dict[str, Agent]):
    prompt_agents = {
        name: agent
        for name, agent in agents_by_name.items()
        if (agent.model_extra.get("ui", {}) or {}).get("type", None) == UiType.hands_off
    }
    steps = []

    tree = Tree(label="")
    screen = Group(splash_screen, Rule(title="Configure Workflow", style="yellow"), tree)
    console.clear()
    console.print(screen)

    handle_input = _create_input_handler([], prompt="Add an agent: ", choice=list(prompt_agents))
    handle_instruction_input = _create_input_handler([], prompt="Enter agent instruction: ")

    while True:
        if not (agent := handle_input()):
            break
        instruction = handle_instruction_input()

        if not steps:
            # change prompt for other passes
            handle_input = _create_input_handler(
                [],
                prompt="Add an agent [leave empty to execute]: ",
                choice=list(prompt_agents),
                optional=True,
            )
            handle_instruction_input = _create_input_handler(
                [],
                prompt="Enter agent instruction [leave empty to pass raw output from previous agent]: ",
                optional=True,
            )

        steps.append({"agent": agent, "instruction": instruction})
        tree.add(
            Panel(
                Group(
                    console.render_str(f"[b]Agent[/b]: {agent}"),
                    console.render_str(f"[b]Prompt[/b]: {instruction or '<raw-previous-output>'}"),
                )
            )
        )
        console.clear()
        console.print(screen)
    return steps


def _get_config_schema(schema: dict[str, Any] | None) -> dict[str, Any] | None:
    if not schema:
        return None
    schema = jsonref.replace_refs(schema, lazy_load=False)

    if not (schema := schema.get("properties", {}).get("config", None)):
        return None

    schema = remove_nullable(schema)
    if not schema.get("properties", None):
        return None
    return schema


@app.command("run")
async def run_agent(
    name: str = typer.Argument(help="Name of the agent to call"),
    input: str = typer.Argument(
        None if sys.stdin.isatty() else sys.stdin.read(),
        help="Agent input as text or JSON",
    ),
    dump_files: Optional[Path] = typer.Option(None, help="Folder path to save any files returned by the agent"),
) -> None:
    """Run an agent."""
    await ensure_llm_env()

    agents_by_name = await _get_agents()
    agent = await _get_agent(name, agents_by_name)
    ui = agent.model_extra.get("ui", {}) or {}
    ui_type = ui.get("type", None)
    is_sequential_workflow = agent.name in {"sequential-workflow"}

    user_greeting = ui.get("userGreeting", None) or "How can I help you?"
    config = {}

    if not input:
        if ui_type not in {UiType.chat, UiType.hands_off} and not is_sequential_workflow:
            err_console.print(
                f"💥 [red][b]Error[/red][/b]: Agent {name} does not use any supported UIs.\n"
                f"Please use the agent according to the following examples and schema:"
            )
            err_console.print(_render_examples(agent))
            err_console.print(Markdown("## Schema"), "")
            err_console.print(_render_schema(agent.inputSchema))
            exit(1)
        console.clear()

        splash_screen = Group(
            Markdown(f"# {agent.name}  \n{agent.description}"),
            NewLine(),
            console.render_str("[b]Running in interactive mode, use '/?' for help, [red]type '/q' to quit.[/red][/b]"),
            NewLine(),
        )

        config_schema = _get_config_schema(agent.inputSchema)

        console.print(splash_screen)

        if config_schema:
            ShowConfig(config_schema, config).handle()

        handle_input = _create_input_handler([ShowConfig(config_schema, config), Set(config_schema, config)])

        console.print()

        if ui_type == UiType.chat:
            messages = []
            console.print(f"🐝 Agent: {user_greeting}\n")
            input = handle_input()
            while True:
                console.print()
                messages.append({"role": "user", "content": input})
                result = await _run_agent(
                    name, {"messages": messages, **({"config": config} if config else {})}, dump_files_path=dump_files
                )
                if not (new_messages := result.output.get("messages", None)):
                    raise ValueError("Agent did not return messages in the output")
                if all([message["role"] == "assistant" for message in new_messages]):
                    messages.extend(new_messages)
                else:
                    messages = new_messages
                input = handle_input()

        elif ui_type == UiType.hands_off:
            user_greeting = ui.get("userGreeting", None) or "Enter your instructions."
            console.print(f"🐝 {user_greeting}\n")
            input = handle_input()
            console.print()
            await _run_agent(name, {"text": input, "config": config}, dump_files_path=dump_files)
        elif is_sequential_workflow:
            workflow_steps = _setup_sequential_workflow(splash_screen, agents_by_name)
            console.print()
            input = filter_dict({**config, "steps": workflow_steps})
            await _run_agent(name, input, dump_files_path=dump_files)

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
    """List agents."""
    result = await send_request(types.ListAgentsRequest(method="agents/list"), types.ListAgentsResult)
    with create_table(Column("Name", style="yellow"), "UI", Column("Description", ratio=1)) as table:
        for agent in result.agents:
            table.add_row(
                agent.name,
                agent.model_extra.get("ui", {}).get("type", None) or "<none>",
                agent.description,
            )
    console.print(table)


async def _get_agents() -> dict[str, Agent]:
    result = await send_request(types.ListAgentsRequest(method="agents/list"), types.ListAgentsResult)
    agents_by_name = {agent.name: agent for agent in result.agents}
    return agents_by_name


async def _get_agent(name: str, agents_by_name: dict[str, Agent] | None = None) -> Agent:
    if not agents_by_name:
        agents_by_name = await _get_agents()
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
    """Show agent details."""
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

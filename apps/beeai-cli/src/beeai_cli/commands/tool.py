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

import rich
import typer
from rich.table import Table
import rich.json

from beeai_cli.async_typer import AsyncTyper, console
from beeai_cli.api import send_request, send_request_with_notifications
from beeai_cli.utils import format_model

from acp import types

app = AsyncTyper()


@app.command("call")
async def run(
    name: str = typer.Argument(help="Name of the tool to call"),
    input: str = typer.Argument(help="Tool input as JSON"),
) -> None:
    """Call a tool with given input."""
    try:
        parsed_input = json.loads(input)
    except json.JSONDecodeError:
        typer.echo("Input must be valid JSON")
        return

    async for message in send_request_with_notifications(
        types.CallToolRequest(
            method="tools/call",
            params=types.CallToolRequestParams(name=name, arguments=parsed_input),
        ),
        types.CallToolResult,
    ):
        typer.echo(format_model(message))


@app.command("list")
async def list_tools():
    """List available tools"""
    result = await send_request(types.ListToolsRequest(method="tools/list"), types.ListToolsResult)
    table = Table("Name", "Description", "Input Schema", expand=True)
    for tool in result.tools:
        table.add_row(tool.name, tool.description, rich.json.JSON.from_data(tool.inputSchema, indent=2))
    console.print(table)

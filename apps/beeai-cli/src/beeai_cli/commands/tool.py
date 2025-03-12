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


import typer
from rich.table import Column

from beeai_cli.async_typer import AsyncTyper, console, create_table
from beeai_cli.api import send_request, send_request_with_notifications
from beeai_cli.utils import format_model, check_json

from acp import types, McpError, ErrorData

app = AsyncTyper()


@app.command("run")
async def run(
    name: str = typer.Argument(help="Name of the tool to call"),
    input: str = typer.Argument(help="Tool input as JSON", callback=check_json),
) -> None:
    """Run a tool."""
    async for message in send_request_with_notifications(
        types.CallToolRequest(
            method="tools/call",
            params=types.CallToolRequestParams(name=name, arguments=input),
        ),
        types.CallToolResult,
    ):
        console.print(format_model(message))


@app.command("list")
async def list_tools():
    """List available tools."""
    result = await send_request(types.ListToolsRequest(method="tools/list"), types.ListToolsResult)
    with create_table(Column("name", style="yellow"), Column("description", ratio=1)) as table:
        for tool in result.tools:
            table.add_row(tool.name, tool.description)
    console.print(table)


@app.command("info")
async def info(name: str = typer.Argument(help="Name of the tool")) -> None:
    """Show tool details."""
    result = await send_request(types.ListToolsRequest(method="tools/list"), types.ListToolsResult)
    tools_by_name = {tool.name: tool for tool in result.tools}
    if not (tool := tools_by_name.get(name, None)):
        raise McpError(error=ErrorData(code=404, message=f"tool/{name} not found in any provider"))
    console.print(tool)

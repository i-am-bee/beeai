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

from beeai_cli.api import api_request
from beeai_cli.async_typer import AsyncTyper, console, create_table
from beeai_cli.utils import parse_env_var

app = AsyncTyper()


@app.command("add")
async def add(
    env: list[str] = typer.Argument(help="Environment variables to pass to provider"),
) -> None:
    """Store environment variables"""
    env_vars = [parse_env_var(var) for var in env]
    env_vars = {name: value for name, value in env_vars}
    await api_request(
        "put",
        "env",
        json={**({"env": env_vars} if env_vars else {})},
    )
    await list_env()


@app.command("list")
async def list_env():
    """List stored environment variables"""
    # TODO: extract server schemas to a separate package
    resp = await api_request("get", "env")
    with create_table(Column("name", style="yellow"), "value") as table:
        for name, value in sorted(resp["env"].items()):
            table.add_row(name, value)
    console.print(table)


@app.command("remove")
async def remove_env(
    env: list[str] = typer.Argument(help="Environment variable(s) to remove"),
):
    await api_request("put", "env", json={**({"env": {var: None for var in env}})})
    await list_env()


@app.command(
    "sync", help="Sync external changes to provider registry (if you modified ~/.beeai/providers.yaml manually)"
)
async def sync():
    """Sync external changes to env configuration (if you modified ~/.beeai/.env manually)"""
    await api_request("put", "env/sync")
    console.print("Env updated")

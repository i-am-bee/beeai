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

from enum import StrEnum
from pathlib import Path

import typer
from rich.table import Table

from beeai_cli.api import api_request
from beeai_cli.async_typer import AsyncTyper, console
from beeai_cli.utils import parse_env_var

app = AsyncTyper()


class ProviderType(StrEnum):
    uvx = "uvx"
    mcp = "mcp"


def _get_abs_location(location: str) -> str:
    if location.startswith("file://"):
        location_abs = Path(location.replace("file://", "")).resolve()
        location = f"file://{location_abs}"
    return location


@app.command("add")
async def add(
    location: str = typer.Argument(
        ...,
        help=(
            "URL of the provider manifest"
            "file://path/to/beeai-manifest.yaml"
            "git+https://github.com/my-org/my-repo.git@2.0.0#path=/path/to/beeai-manifest.yaml ..."
        ),
    ),
    env: list[str] = typer.Option(
        [],
        "--env",
        help="Environment variables to pass to provider",
        show_default=False,
    ),
) -> None:
    """Call a tool with given input."""
    env_vars = [parse_env_var(var) for var in env]
    env_vars = {name: value for name, value in env_vars}
    location = _get_abs_location(location)
    await api_request(
        "post",
        "provider",
        json={
            "location": location,
            **({"env": env_vars} if env_vars else {}),
        },
    )
    typer.echo(f"Added provider: {location}")


def render_enum(value: str, colors: dict[str, str]) -> str:
    if color := colors.get(value, None):
        return f"[{color}]{value}[/{color}]"
    return value


@app.command("list")
async def list():
    # TODO: extract server schemas to a separate package
    resp = await api_request("get", "provider")
    table = Table("ID", "Status", "Last Error", expand=True)
    for item in sorted(
        sorted(resp["items"], key=lambda item: item["id"]), key=lambda item: item["status"], reverse=True
    ):
        table.add_row(
            item["id"],
            render_enum(
                item["status"],
                {
                    "ready": "green",
                    "initializing": "yellow",
                    "error": "red",
                    "unsupported": "orange1",
                },
            ),
            item["last_error"] if item["status"] != "ready" else "",
        )
    console.print(table)


@app.command("remove")
async def remove(
    location: str = typer.Argument(..., help="URL of the provider manifest (from beeai provider list)"),
) -> None:
    """Call a tool with given input."""
    location = _get_abs_location(location)
    await api_request("post", "provider/delete", json={"location": location})
    console.print(f"Removed provider: {location}")


@app.command("sync")
async def sync(help="Sync external changes to provider registry (if you modified ~/.beeai/providers.yaml manually)"):
    await api_request("put", "provider/sync")
    console.print("Providers updated")

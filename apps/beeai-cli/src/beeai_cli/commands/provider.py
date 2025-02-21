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
) -> None:
    """Add a new provider"""
    location = _get_abs_location(location)
    resp = await api_request("post", "provider", json={"location": location})
    typer.echo(resp)
    typer.echo(f"Added provider: {location}")


def render_enum(value: str, colors: dict[str, str]) -> str:
    if color := colors.get(value, None):
        return f"[{color}]{value}[/{color}]"
    return value


@app.command("list")
async def list_providers():
    """Remove provider"""
    resp = await api_request("get", "provider")
    table = Table("ID", "Status", "Last Error", "Missing Configuration", expand=True)
    table.columns[0].overflow = "fold"
    for item in sorted(
        sorted(resp["items"], key=lambda item: item["id"]), key=lambda item: item["status"], reverse=True
    ):
        missing_config_table = Table.grid("name", "description", expand=True, pad_edge=False, padding=0)
        for env in item["missing_configuration"]:
            missing_config_table.add_row(env["name"], env["description"])
        missing_config_table.add_row()
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
            missing_config_table,
        )
    console.print(table)


@app.command("remove")
async def remove(
    location: str = typer.Argument(..., help="URL of the provider manifest (from beeai provider list)"),
) -> None:
    """Remove provider by ID"""
    location = _get_abs_location(location)
    providers = (await api_request("get", "provider"))["items"]
    remove_providers = [provider["id"] for provider in providers if location in provider["id"]]
    if len(remove_providers) != 1:
        remove_providers_detail = ":\n\t" + "\n\t".join(remove_providers) if remove_providers else ""
        raise ValueError(f"{len(remove_providers)} matching providers{remove_providers_detail}")
    await api_request("post", "provider/delete", json={"location": remove_providers[0]})
    console.print(f"Removed provider: {location}")


@app.command("sync")
async def sync():
    """Sync external changes to provider registry (if you modified ~/.beeai/providers.yaml manually)"""
    await api_request("put", "provider/sync")
    console.print("Providers updated")

from enum import StrEnum
from pathlib import Path

import typer
import yaml

from beeai_cli.api import request
from beeai_cli.async_typer import AsyncTyper

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
    """Call a tool with given input."""
    location = _get_abs_location(location)
    await request("post", "provider", json={"location": location})
    typer.echo(f"Added provider: {location}")


@app.command("list")
async def list():
    resp = await request("get", "provider")
    typer.echo(yaml.dump(resp))


@app.command("remove")
async def remove(
    location: str = typer.Argument(..., help="URL of the provider manifest (from beeai provider list)"),
) -> None:
    """Call a tool with given input."""
    location = _get_abs_location(location)
    await request("post", "provider/delete", json={"location": location})
    typer.echo(f"Removed provider: {location}")

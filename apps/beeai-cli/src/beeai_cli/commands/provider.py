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

import hashlib
import re
from enum import StrEnum
from pathlib import Path
from typing import Any

import typer
from pydantic import ValidationError
from rich.table import Column

from beeai_cli.api import api_request
from beeai_cli.async_typer import AsyncTyper, console, create_table

app = AsyncTyper()


class ProviderType(StrEnum):
    uvx = "uvx"
    mcp = "mcp"


def _get_abs_location(location: str) -> str:
    if location.startswith("file://"):
        location_abs = Path(location.replace("file://", "")).resolve()
        location = f"file://{location_abs}"
    return location


@app.command("preview")
async def preview(
    location: str = typer.Argument(
        ...,
        help=(
            "URL of the provider manifest, for example:\n\n"
            "- file://path/to/beeai-manifest.yaml\n\n"
            "- git+https://github.com/my-org/my-repo.git@2.0.0#path=/path/to/beeai-manifest.yaml\n\n"
        ),
    ),
) -> None:
    """Preview provider configuration (without adding it to the platform)."""
    location = _get_abs_location(location)
    resp = await api_request("post", "provider/preview", json={"location": location})
    console.print(resp)


@app.command("add")
async def add(
    location: str = typer.Argument(
        ...,
        help=(
            "URL of the provider manifest, for example:\n\n"
            "- file://path/to/beeai-manifest.yaml\n\n"
            "- git+https://github.com/my-org/my-repo.git@2.0.0#path=/path/to/beeai-manifest.yaml\n\n"
        ),
    ),
) -> None:
    """Add a provider."""
    location = _get_abs_location(location)
    await api_request("post", "provider", json={"location": location})
    await list_providers()


def render_enum(value: str, colors: dict[str, str]) -> str:
    if color := colors.get(value, None):
        return f"[{color}]{value}[/{color}]"
    return value


def _get_short_id(long_id: str):
    return hashlib.sha256(long_id.encode("utf-8")).hexdigest()[:8]


def _get_short_location(location: str) -> str:
    try:
        from beeai_server.utils.github import GithubUrl
        from beeai_server.domain.constants import DEFAULT_MANIFEST_PATH
    except ImportError:
        return location
    replace_provider_re = rf"/?{DEFAULT_MANIFEST_PATH}$"
    try:
        url = GithubUrl(location)
        return "".join(
            (
                f"{url.org}/{url.repo}",
                f"@{url.version}" if url.version else "",
                f":{re.sub(replace_provider_re, '', url.path)}" if url.path else "",
            )
        )
    except ValidationError:
        return re.sub(replace_provider_re, "", location.replace("file://", ""))


@app.command("list")
async def list_providers():
    """List providers."""
    resp = await api_request("get", "provider")
    max_len = max(len(_get_short_location(item["id"])) for item in (resp["items"])) if resp["items"] else 0

    with create_table(
        Column("Short ID", max_width=8, style="yellow"),
        Column("Status", max_width=len("initializing")),
        Column("Missing Env", max_width=50),
        Column("Location", max_width=min(max_len, 70)),
        Column("Last Error", ratio=1),
    ) as table:
        for item in sorted(
            sorted(
                resp["items"], key=lambda item: ((item.get("registry", None) or "z"), _get_short_location(item["id"]))
            ),
            key=lambda item: item["status"],
            reverse=True,
        ):
            table.add_row(
                _get_short_id(item["id"]),
                render_enum(
                    item["status"],
                    {
                        "ready": "green",
                        "initializing": "yellow",
                        "error": "red",
                        "unsupported": "orange1",
                    },
                ),
                ",".join(var["name"] for var in item["missing_configuration"]) or "<none>",
                _get_short_location(item["id"]),
                (item.get("last_error") or {}).get("message", None) if item["status"] != "ready" else "<none>",
            )
    console.print(table)


def select_provider(location_or_id: str, providers: list[dict[str, Any]]):
    provider_candidates = {p["id"]: p for p in providers if location_or_id in p["id"]}
    provider_candidates.update({p["id"]: p for p in providers if location_or_id in _get_short_id(p["id"])})
    provider_candidates.update({p["id"]: p for p in providers if location_or_id in _get_short_location(p["id"])})
    if len(provider_candidates) != 1:
        provider_candidates = [f"  - {c}" for c in provider_candidates]
        remove_providers_detail = ":\n" + "\n".join(provider_candidates) if provider_candidates else ""
        raise ValueError(f"{len(provider_candidates)} matching providers{remove_providers_detail}")
    [selected_provider] = provider_candidates.values()
    return selected_provider


@app.command("remove")
async def remove(
    location_or_id: str = typer.Argument(
        ..., help="Short ID or part of the URL of the provider manifest (from beeai provider list)"
    ),
) -> None:
    """Remove provider."""
    location_or_id = _get_abs_location(location_or_id)
    providers = (await api_request("get", "provider"))["items"]
    remove_provider = select_provider(location_or_id, providers)["id"]
    await api_request("post", "provider/delete", json={"location": remove_provider})
    await list_providers()


@app.command("info")
async def info(
    location_or_id: str = typer.Argument(
        ..., help="Short ID or part of the URL of the provider manifest (from beeai provider list)"
    ),
):
    """Show provider details."""
    providers = (await api_request("get", "provider"))["items"]
    provider = select_provider(location_or_id, providers)
    console.print(provider)


@app.command("sync")
async def sync():
    """Sync provider registry (if you modified ~/.beeai/providers.yaml manually)."""
    await api_request("put", "provider/sync")
    console.print("Providers updated")

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
import functools
import enum
import json
import os
import subprocess
import time
import urllib
import urllib.parse

import httpx
import typer
from httpx import HTTPStatusError

from beeai_cli.configuration import Configuration
from beeai_sdk.utils.api import send_request as _send_request
from beeai_sdk.utils.api import send_request_with_notifications as _send_request_with_notifications

config = Configuration()
BASE_URL = str(config.host).rstrip("/")
API_BASE_URL = f"{BASE_URL}/api/v1/"
MCP_URL = f"{BASE_URL}{config.mcp_sse_path}"


class BrewServiceStatus(enum.StrEnum):
    not_installed = "not_installed"
    stopped = "stopped"
    started = "started"


def brew_service_status() -> BrewServiceStatus:
    beeai_service = None
    with contextlib.suppress(Exception):
        services = json.loads(subprocess.check_output(["brew", "services", "list", "--json"]))
        beeai_service = next((service for service in services if service["name"] == "beeai"), None)
    if not beeai_service:
        return BrewServiceStatus.not_installed
    elif beeai_service["status"] == "started":
        return BrewServiceStatus.started
    else:
        return BrewServiceStatus.stopped


def resolve_connection_error(retried: bool = False):
    if BASE_URL != "http://localhost:8333":
        typer.echo(f"💥 {typer.style('ConnectError', fg='red')}: Could not connect to the local BeeAI service.")
        typer.echo(
            f'💡 {typer.style("HINT", fg="yellow")}: You have set the BeeAI host to "{typer.style(BASE_URL, bold=True)}" -- is this correct?'
        )
        exit(1)

    if retried:
        typer.echo(f"💥 {typer.style('ConnectError', fg='red')}: We failed to automatically start the BeeAI service.")
        typer.echo(
            f"💡 {typer.style('HINT', fg='yellow')}: Try starting the service manually with: {typer.style('brew services start beeai', fg='green')}"
        )
        exit(1)

    status = brew_service_status()
    if status == BrewServiceStatus.started:
        typer.echo(
            f"💥 {typer.style('ConnectError', fg='red')}: The BeeAI service is running, but it did not accept the connection."
        )
        typer.echo(
            f"💡 {typer.style('HINT', fg='yellow')}: Try reinstalling the service with {typer.style('brew reinstall beeai', fg='green')}, then retry."
        )
        exit(1)

    if status == BrewServiceStatus.not_installed:
        typer.echo(f"💥 {typer.style('ConnectError', fg='red')}: BeeAI service is not running.")
        typer.echo(
            f"💡 {typer.style('HINT', fg='yellow')}: In a separate terminal, run {typer.style('beeai serve', fg='green')}, keep it running and retry this command."
        )
        typer.echo(
            f"💡 {typer.style('HINT', fg='yellow')}: ...or alternatively, install BeeAI through {typer.style('brew', fg='green')} which includes a background service."
        )
        exit(1)

    typer.echo(f"⏳ {typer.style('Auto-resolving', fg='magenta')}: Starting the BeeAI service, stand by...")
    with contextlib.suppress(Exception):
        os.system("brew services start beeai")
        typer.echo(f"⏳  {typer.style('Auto-resolving', fg='magenta')}: Waiting for the service to boot up...")
        time.sleep(10.0)
        typer.echo(
            f"ℹ️  {typer.style('NOTE', fg='blue')}: It will take a few minutes before all of the agents are available, please be patient!"
        )


async def api_request(method: str, path: str, json: dict | None = None) -> dict | None:
    """Make an API request to the server."""
    async with httpx.AsyncClient() as client:
        response = await client.request(method, urllib.parse.urljoin(API_BASE_URL, path), json=json)
        if response.is_error:
            try:
                error = response.json()
                error = error.get("detail", str(error))
            except Exception:
                response.raise_for_status()
            raise HTTPStatusError(message=error, request=response.request, response=response)
        if response.content:
            return response.json()


send_request_with_notifications = functools.partial(_send_request_with_notifications, MCP_URL)
send_request = functools.partial(_send_request, MCP_URL)

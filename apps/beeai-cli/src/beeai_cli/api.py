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
import json
import subprocess
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


def show_connect_hint():
    typer.echo(f"💥 {typer.style('ConnectError', fg='red')}: Could not connect to the local BeeAI platform.")

    beeai_service = None
    with contextlib.suppress(Exception):
        services = json.loads(subprocess.check_output(["brew", "services", "list", "--json"]))
        beeai_service = next((service for service in services if service["name"] == "beeai"), None)

    if BASE_URL != "http://localhost:8333":
        typer.echo(
            f'💡 {typer.style("HINT", fg="yellow")}: You have set the BeeAI platform host to "{typer.style(BASE_URL, bold=True)}" -- is this correct?'
        )
    elif not beeai_service:
        typer.echo(
            f"💡 {typer.style('HINT', fg='yellow')}: In a separate terminal, run {typer.style('beeai serve', fg='green')}, keep it running and retry."
        )
    elif beeai_service["status"] == "started":
        typer.echo(
            f"💡 {typer.style('HINT', fg='yellow')}: Reinstall the service with {typer.style('brew reinstall beeai', fg='green')}, then start the service with {typer.style('brew services start beeai', fg='green')} and retry."
        )
    else:
        typer.echo(
            f"💡 {typer.style('HINT', fg='yellow')}: Start the service with {typer.style('brew services start beeai', fg='green')} and retry."
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

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
import json
import subprocess
import urllib
import urllib.parse
import uuid
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import anyio
import httpx
from httpx import ConnectError, HTTPStatusError
from acp import ClientSession, types, ServerNotification
from acp.client.sse import sse_client
from acp.shared.session import ReceiveResultT
from acp.types import RequestParams
from beeai_cli.async_typer import err_console

from beeai_cli.configuration import Configuration
import typer

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


@asynccontextmanager
async def mcp_client() -> AsyncGenerator[ClientSession, None]:
    """Context manager for MCP client connection."""
    try:
        async with sse_client(url=MCP_URL) as (read_stream, write_stream):
            async with ClientSession(read_stream, write_stream) as session:
                await session.initialize()
                yield session
    except* ConnectError:
        show_connect_hint()
        exit(1)


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


async def send_request_with_notifications(
    req: types.Request, result_type: type[ReceiveResultT]
) -> AsyncGenerator[ReceiveResultT | ServerNotification | None, None]:
    resp: ReceiveResultT | None = None
    async with mcp_client() as session:
        await session.initialize()

        message_writer, message_reader = anyio.create_memory_object_stream()

        req = types.ClientRequest(req).root
        req.params = req.params or RequestParams()
        req.params.meta = RequestParams.Meta(progressToken=uuid.uuid4().hex)
        req = types.ClientRequest(req)

        async with anyio.create_task_group() as task_group:

            async def request_task():
                nonlocal resp
                try:
                    resp = await session.send_request(req, result_type)
                finally:
                    task_group.cancel_scope.cancel()

            async def read_notifications():
                # IMPORTANT(!) if the client does not read the notifications, it gets blocked never receiving the response
                async for message in session.incoming_messages:
                    try:
                        notification = ServerNotification.model_validate(message)
                        await message_writer.send(notification)
                    except ValueError:
                        err_console.print(f"Unable to parse message from server: {message}")

            task_group.start_soon(read_notifications)
            task_group.start_soon(request_task)

            async for message in message_reader:
                yield message
    if resp:
        yield resp


async def send_request(req: types.Request, result_type: type[ReceiveResultT]) -> ReceiveResultT:
    async for message in send_request_with_notifications(req, result_type):
        if isinstance(message, result_type):
            return message
    raise RuntimeError(f"No response of type {result_type.__name__} was returned")

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

import asyncio
import logging
import os
from pathlib import Path
import signal
from contextlib import asynccontextmanager, suppress
from typing import Any

import anyio
import anyio.abc
import anyio.to_thread
import psutil
from anyio import create_task_group, CancelScope
from httpx import ConnectError

from acp.client.sse import sse_client
from acp.client.stdio import get_default_environment
from pydantic import BaseModel, Field

from beeai_server.custom_types import McpClient

logger = logging.getLogger(__name__)


class ManagedServerParameters(BaseModel):
    command: str
    """The executable to run to start the server."""

    args: list[str] = Field(default_factory=list)  # noqa: F821
    """Command line arguments to pass to the executable."""

    env: dict[str, str] | None = None
    """
    The environment to use when spawning the process.

    If not specified, the result of get_default_environment() will be used.
    """

    cwd: Path | None = None

    headers: dict[str, Any] | None = (None,)
    timeout: float = 5
    sse_read_timeout: float = 60 * 5
    graceful_terminate_timeout: float = 1
    endpoint: str = "/sse"


def _kill_process_group(process: anyio.abc.Process):
    with suppress(ProcessLookupError):
        os.getpgid(process.pid)
        os.killpg(process.pid, signal.SIGKILL)


@asynccontextmanager
async def managed_sse_client(server: ManagedServerParameters) -> McpClient:
    """
    Client transport for stdio: this will connect to a server by spawning a
    process and communicating with it over stdin/stdout.
    """
    port = await find_free_port()

    process = await anyio.open_process(
        [server.command, *server.args],
        cwd=server.cwd,
        env={"PORT": str(port), **(server.env if server.env is not None else get_default_environment())},
        start_new_session=True,
    )

    async def log_process_stdout():
        async for line in process.stdout:
            logger.info(f"stdout: {line.decode().strip()}")

    async def log_process_stderr():
        async for line in process.stderr:
            logger.info(f"stderr: {line.decode().strip()}")

    async with process, create_task_group() as tg:
        tg.start_soon(log_process_stdout)
        tg.start_soon(log_process_stderr)
        try:
            for attempt in range(8):
                try:
                    async with sse_client(
                        url=f"http://localhost:{port}/{server.endpoint.lstrip('/')}", timeout=60
                    ) as streams:
                        yield streams
                        break
                except* ConnectError as ex:
                    if process.returncode or not (await anyio.to_thread.run_sync(psutil.pid_exists, process.pid)):
                        raise ConnectionError(f"Provider process exited with code {process.returncode}")
                    timeout = 2**attempt
                    logger.warning(f"Failed to connect to provider. Reconnecting in {timeout} seconds: {ex!r}")
                    await asyncio.sleep(timeout)
            else:
                raise ConnectionError("Failed to connect to provider.")
        finally:
            with CancelScope(shield=True):
                with anyio.move_on_after(server.graceful_terminate_timeout) as cancel_scope:
                    try:
                        process.terminate()
                        await process.wait()
                    except ProcessLookupError:
                        logger.warning("Provider process died prematurely")

                if cancel_scope.cancel_called:
                    logger.warning(
                        f"Provider process did not terminate in {server.graceful_terminate_timeout}s, killing it."
                    )
                    await anyio.to_thread.run_sync(_kill_process_group, process)
                tg.cancel_scope.cancel()


async def find_free_port():
    """Get a random free port assigned by the OS."""
    listener = await anyio.create_tcp_listener()
    port = listener.extra(anyio.abc.SocketAttribute.local_address)[1]
    await listener.aclose()
    return port

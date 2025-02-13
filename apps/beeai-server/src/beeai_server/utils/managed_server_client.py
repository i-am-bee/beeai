import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Any

import anyio
import anyio.abc
from anyio import create_task_group
from mcp.client.sse import sse_client
from mcp.client.stdio import get_default_environment
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

    headers: dict[str, Any] | None = (None,)
    timeout: float = 5
    sse_read_timeout: float = 60 * 5
    graceful_terminate_timeout: float = 2
    endpoint: str = "/sse"


@asynccontextmanager
async def managed_sse_client(server: ManagedServerParameters) -> McpClient:
    """
    Client transport for stdio: this will connect to a server by spawning a
    process and communicating with it over stdin/stdout.
    """
    port = await find_free_port()

    process = await anyio.open_process(
        [server.command, *server.args],
        env={"PORT": str(port), **(server.env if server.env is not None else get_default_environment())},
    )

    async def log_process_stdout():
        async for line in process.stdout:
            logger.info(line.decode().strip(), extra={"managed_sse_provider": port})

    async def log_process_stderr():
        async for line in process.stderr:
            logger.info(line.decode().strip(), extra={"managed_sse_provider": port})

    async with process, create_task_group() as tg:
        tg.start_soon(log_process_stdout)
        tg.start_soon(log_process_stderr)
        failed = True
        for attempt in range(6):
            try:
                async with sse_client(
                    url=f"http://localhost:{port}/{server.endpoint.lstrip('/')}", timeout=60
                ) as streams:
                    yield streams
                    failed = False
                    break
            except Exception as ex:
                timeout = 2**attempt
                logger.warning(f"Failed to connect to provider. Reconnecting in {timeout} seconds: {ex}")
                await asyncio.sleep(2)


        with anyio.move_on_after(server.graceful_terminate_timeout) as cancel_scope:
            process.terminate()
            await process.wait()

        if cancel_scope.cancel_called:
            logger.warning(f"Provider process did not terminate in {server.graceful_terminate_timeout}s, killing it.")
            process.kill()
        tg.cancel_scope.cancel()
        if failed:
            raise ConnectionError("Failed to connect to provider.")


async def find_free_port():
    """Get a random free port assigned by the OS."""
    listener = await anyio.create_tcp_listener()
    port = listener.extra(anyio.abc.SocketAttribute.local_address)[1]
    await listener.aclose()
    return port

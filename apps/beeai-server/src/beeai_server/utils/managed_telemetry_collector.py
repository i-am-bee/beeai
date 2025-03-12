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

import logging
from contextlib import asynccontextmanager

import anyio
import anyio.abc
import anyio.to_thread
from anyio import create_task_group, CancelScope
from pydantic import BaseModel, Field

from beeai_server.utils.managed_server_client import _kill_process_group

logger = logging.getLogger(__name__)


class ManagedTelemetryCollectorParameters(BaseModel):
    command: str
    """The executable to run to start the server."""
    args: list[str] = Field(default_factory=list)  # noqa: F821
    """Command line arguments to pass to the executable."""
    graceful_terminate_timeout: float = 2


@asynccontextmanager
async def managed_telemetry_collector(params: ManagedTelemetryCollectorParameters):
    process = await anyio.open_process(
        [params.command, *params.args],
        start_new_session=True,
    )

    async def log_process_stdout():
        with CancelScope(shield=True):
            async for line in process.stdout:
                logger.info(f"stdout: {line.decode().strip()}")

    async def log_process_stderr():
        with CancelScope(shield=True):
            async for line in process.stderr:
                logger.info(f"stderr: {line.decode().strip()}")

    async with process, create_task_group() as tg:
        tg.start_soon(log_process_stdout)
        tg.start_soon(log_process_stderr)
        try:
            # wait for boot, healthcheck
            yield process
        finally:
            with CancelScope(shield=True):
                with anyio.move_on_after(params.graceful_terminate_timeout) as cancel_scope:
                    try:
                        process.terminate()
                        await process.wait()
                    except ProcessLookupError:
                        logger.warning("Collector process died prematurely")

                if cancel_scope.cancel_called:
                    logger.warning(
                        f"Collector process did not terminate in {params.graceful_terminate_timeout}s, killing it."
                    )
                    await anyio.to_thread.run_sync(_kill_process_group, process)
                tg.cancel_scope.cancel()

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
import os
import signal
from contextlib import suppress

import anyio.abc
import anyio.to_thread
from anyio import CancelScope

logger = logging.getLogger(__name__)


def _kill_process_group(process: anyio.abc.Process):
    with suppress(ProcessLookupError):
        pgid = os.getpgid(process.pid)
        os.killpg(pgid, signal.SIGKILL)


async def terminate_process(process: anyio.abc.Process, timeout: float | None = 1):
    with CancelScope(shield=True):
        with anyio.move_on_after(timeout) as cancel_scope:
            try:
                process.terminate()
                await process.wait()
            except ProcessLookupError:
                logger.info("Provider process already terminated")

        if cancel_scope.cancel_called:
            logger.warning(f"Provider process did not terminate in {timeout}s, killing it.")
            await anyio.to_thread.run_sync(_kill_process_group, process)

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
import socket
import sys

from beeai_server.configuration import get_configuration

# configure logging before importing anything
from beeai_server.logging_config import configure_logging

configure_logging()

logger = logging.getLogger(__name__)


def serve():
    config = get_configuration()
    host = "0.0.0.0"

    if sys.platform == "win32":
        logger.error("Native windows is not supported, use WSL")
        return

    with socket.socket(socket.AF_INET) as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            sock.bind((host, config.port))
        except OSError as exc:  # pragma: full coverage
            logger.error(exc)
            return

    os.execv(
        sys.executable,
        [
            sys.executable,
            "-m",
            "uvicorn",
            "beeai_server.application:app",
            f"--host={host}",
            f"--port={config.port}",
            "--timeout-keep-alive=4",  # TODO: MCP server is not destroyed correctly
            "--timeout-graceful-shutdown=5",  # TODO: MCP server is not destroyed correctly
        ],
    )


__all__ = ["serve"]

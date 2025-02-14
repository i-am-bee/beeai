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
            "python",
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

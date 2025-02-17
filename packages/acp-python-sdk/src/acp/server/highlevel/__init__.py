"""FastMCP - A more ergonomic interface for MCP servers."""

from importlib.metadata import version

from .server import Context, Server
from .utilities.types import Image

__version__ = version("acp-sdk")
__all__ = ["Server", "Context", "Image"]

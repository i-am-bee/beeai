"""
This module provides simpler types to use with the server for managing prompts
and tools.
"""

from pydantic import BaseModel

from acp.types import (
    ServerCapabilities,
)


class InitializationOptions(BaseModel):
    server_name: str
    server_version: str
    capabilities: ServerCapabilities
    instructions: str | None = None

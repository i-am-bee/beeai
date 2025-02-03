from contextlib import asynccontextmanager
from pathlib import Path
from typing import Union

from pydantic import BaseModel, AnyUrl, Field, ConfigDict

from mcp import stdio_client, StdioServerParameters
from mcp.client.sse import sse_client


class GithubProvider(BaseModel):
    model_config = ConfigDict(frozen=True)
    github: AnyUrl


class LocalProvider(BaseModel):
    model_config = ConfigDict(frozen=True)
    path: Path


class HttpProvider(BaseModel):
    model_config = ConfigDict(frozen=True)
    url: AnyUrl


Provider = Union[GithubProvider, LocalProvider, HttpProvider]


# Connection to agent server


class StdioCommand(BaseModel):
    """Spawn server locally as a subprocess"""

    command: list[str]
    env: dict[str, str] = Field(default_factory=dict)

    @asynccontextmanager
    async def mcp_client(self):
        async with stdio_client(StdioServerParameters(command=self.command[0], args=self.command[1:])) as client:
            yield client


class SSEServer(BaseModel):
    """Connect to a remote server"""

    url: AnyUrl

    @asynccontextmanager
    async def mcp_client(self):
        async with sse_client(str(self.url)) as client:
            yield client


ProviderConnection = Union[StdioCommand, SSEServer]

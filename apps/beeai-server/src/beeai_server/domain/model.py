import abc
from contextlib import asynccontextmanager
from enum import StrEnum
from typing import Literal

import anyio
import anyio.to_thread
import httpx
import yaml
from anyio import Path
from kink import inject
from acp import stdio_client, StdioServerParameters
from acp.client.sse import sse_client
from packaging import version
from pydantic import BaseModel, Field, FileUrl, RootModel, field_validator
from pydantic_core.core_schema import ValidationInfo

from beeai_server.configuration import Configuration
from beeai_server.custom_types import McpClient, ID
from beeai_server.domain.constants import DEFAULT_MANIFEST_PATH
from beeai_server.exceptions import UnsupportedProviderError
from beeai_server.utils.github import GithubUrl, download_repo
from beeai_server.utils.managed_server_client import managed_sse_client, ManagedServerParameters
from beeai_server.utils.utils import which


class ProviderDriver(StrEnum):
    nodejs = "nodejs"
    python = "python"
    container = "container"
    unmanaged = "unmanaged"


class ServerType(StrEnum):
    stdio = "stdio"
    http = "http"


class EnvVar(BaseModel):
    name: str
    description: str
    required: bool = False


class McpTransport(StrEnum):
    sse = "sse"
    none = "none"


class BaseProvider(BaseModel, abc.ABC):
    manifestVersion: int
    mcpTransport: McpTransport = Field(default=McpTransport.sse, description="Valid for serverType http")
    mcpEndpoint: str = Field(default="/sse", description="Valid for serverType http")
    ui: list[str] = Field(default_factory=list)

    base_file_path: str | None = None

    async def check(self) -> None:
        pass

    @abc.abstractmethod
    def mcp_client(self) -> McpClient: ...


class UnmanagedProvider(BaseProvider):
    driver: Literal[ProviderDriver.unmanaged] = ProviderDriver.unmanaged
    serverType: Literal[ServerType.http] = ServerType.http

    async def check(self) -> None:
        return

    @asynccontextmanager
    async def mcp_client(self) -> McpClient:
        match (self.serverType, self.mcpTransport):
            case (ServerType.http, McpTransport.sse):
                async with sse_client(str(self.mcpEndpoint)) as client:
                    yield client
            case _:
                raise NotImplementedError(f"Transport {self.mcpTransport} not implemented")


class ManagedProvider(BaseProvider, abc.ABC):
    serverType: ServerType = ServerType.stdio
    command: list[str] = Field(description="Command with arguments to run")
    env: list[EnvVar] = Field(default_factory=list, description="For configuration -- passed to the process")

    @asynccontextmanager
    async def _get_mcp_client(self, command: list[str]) -> McpClient:
        command, args = command[0], command[1:]
        match (self.serverType, self.mcpTransport):
            case (ServerType.stdio, _):
                async with stdio_client(StdioServerParameters(command=command, args=args)) as client:
                    yield client
            case (ServerType.http, McpTransport.sse):
                async with managed_sse_client(
                    ManagedServerParameters(command=command, args=args, endpoint=self.mcpEndpoint)
                ) as client:
                    yield client
            case _:
                raise NotImplementedError(f"Transport {self.mcpTransport} not implemented")


class NodeJsProvider(ManagedProvider):
    driver: Literal[ProviderDriver.nodejs] = ProviderDriver.nodejs
    command: list[str] = Field(default_factory=list, description="Command with arguments to run")
    package: str = Field(
        default=None,
        description='NPM package or "git+https://..." URL, or "file://..." URL (not allowed in remote manifests)',
    )

    async def check(self):
        if not await which("npm"):
            raise UnsupportedProviderError("npm is not installed, see https://nodejs.org/en/download")

    @field_validator("package", mode="after")
    @classmethod
    def _validate_package(cls, value: str, info: ValidationInfo) -> str:
        base_file_path = info.data.get("base_file_path", None)
        if value.startswith((".", "/")) and base_file_path:
            package_path = Path(value)
            base_file_path = Path(base_file_path)
            if not package_path.is_absolute():
                return f"{base_file_path / package_path}"
        return value

    @asynccontextmanager
    @inject
    async def mcp_client(self, configuration: Configuration) -> McpClient:  # noqa: F821
        await self.check()
        try:
            github_url = GithubUrl.model_validate(self.package)
            repo_path = await download_repo(configuration.cache_dir / "github_npm", github_url)
            package_path = repo_path / (github_url.path or "")
            await anyio.run_process(["npm", "install"], cwd=package_path)
            package = str(package_path)
        except ValueError:
            package = self.package
        async with super()._get_mcp_client(command=["npx", "-y", package, *self.command]) as client:
            yield client


class PythonProvider(ManagedProvider):
    driver: Literal[ProviderDriver.python] = ProviderDriver.python
    pythonVersion: str | None = None
    package: str = Field(
        default=None,
        description='PyPI package or "git+https://..." URL, or "file://..." URL (not allowed in remote manifests)',
    )

    async def check(self) -> None:
        if not await which("uvx"):
            raise UnsupportedProviderError(
                "uv is not installed, see https://docs.astral.sh/uv/getting-started/installation/"
            )

    @field_validator("pythonVersion", mode="after")
    @classmethod
    def _validate_python_version(cls, value: str | None, info: ValidationInfo) -> str | None:
        if value:
            parsed_version = version.parse(value)
            if parsed_version.major != 3 or parsed_version.minor <= 7:
                raise ValueError(f"Invalid Python version {version}, supported python >=3.8")
        return value

    @field_validator("package", mode="after")
    @classmethod
    def _validate_package(cls, value: str, info: ValidationInfo) -> str:
        base_file_path = info.data.get("base_file_path", None)
        if value.startswith("file://") and base_file_path:
            package_path = Path(value.replace("file://", ""))
            if not package_path.is_absolute():
                return f"file://{Path(base_file_path) / package_path}"
        return value

    @asynccontextmanager
    async def mcp_client(self) -> McpClient:  # noqa: F821
        await self.check()
        python = [] if not self.pythonVersion else ["--python", self.pythonVersion]
        async with super()._get_mcp_client(
            command=["uvx", *python, "--from", self.package, "--reinstall", *self.command]
        ) as client:
            yield client


class ContainerProvider(ManagedProvider):
    driver: Literal[ProviderDriver.container] = ProviderDriver.container
    command: list[str] = Field(default_factory=list, description="Command with arguments to run")
    image: str = Field(description="Container image identifier, e.g. 'docker.io/something/here:latest'")

    _runtime = "docker"

    async def check(self) -> None:
        if await which("docker"):
            return
        if await which("podman"):
            self._runtime = "podman"
            return
        raise UnsupportedProviderError("docker is not installed, see https://docs.docker.com/get-started/get-docker/")

    @asynccontextmanager
    async def mcp_client(self) -> McpClient:  # noqa: F821
        await self.check()
        async with super()._get_mcp_client(
            command=[self._runtime, "run", "--rm", "-i", "-e=PORT", "--network=host", self.image, *self.command]
        ) as client:
            yield client


ProviderManifest = UnmanagedProvider | NodeJsProvider | PythonProvider | ContainerProvider


class Provider(BaseModel):
    manifest: ProviderManifest
    id: ID
    registry: GithubUrl | None = None


class LoadedProviderStatus(StrEnum):
    initializing = "initializing"
    ready = "ready"
    error = "error"
    unsupported = "unsupported"


class ProviderWithStatus(Provider):
    status: LoadedProviderStatus
    last_error: str | None = None


class GitHubManifestLocation(RootModel):
    root: GithubUrl
    _resolved = False

    @property
    def provider_id(self) -> str:
        if not self._resolved:
            raise ValueError("Provider path not fully resolved")
        return str(self.root)

    async def resolve(self):
        if not (self.root.path or "").endswith(".yaml"):
            self.root.path = f"{self.root.path or ''}/{DEFAULT_MANIFEST_PATH}"
        await self.root.resolve_version()
        self._resolved = True

    async def load(self) -> Provider:
        await self.resolve()
        async with httpx.AsyncClient(
            headers={"Cache-Control": "no-cache, no-store, must-revalidate", "Pragma": "no-cache", "Expires": "0"}
        ) as client:
            resp = await client.get(str(self.root.get_raw_url(self.root.path or DEFAULT_MANIFEST_PATH)))
            resp.raise_for_status()
        return Provider.model_validate({"manifest": yaml.safe_load(resp.text), "id": self.provider_id})

    def __str__(self):
        return str(self.root)


class LocalFileManifestLocation(RootModel):
    root: FileUrl
    _resolved = False

    @property
    def provider_id(self) -> str:
        if not self._resolved:
            raise ValueError("Provider path not fully resolved")
        return str(self.root)

    async def resolve(self):
        path = Path(self.root.path)
        if not path.is_absolute():
            raise ValueError("Cannot resolve relative file path.")
        if not await path.is_file() and not self.root.path.endswith(".yaml"):
            path = path / DEFAULT_MANIFEST_PATH
        if not (await path.is_file()):
            raise ValueError(f"File not found: {path}")
        self.root = FileUrl.build(scheme=self.root.scheme, host="", path=str(path))
        self._resolved = True

    async def load(self) -> Provider:
        await self.resolve()
        path = Path(self.root.path)
        content = await path.read_text()
        return Provider.model_validate(
            {
                "manifest": {**yaml.safe_load(content), "base_file_path": str(path.parent)},
                "id": self.provider_id,
            }
        )

    def __str__(self):
        return str(self.root)


ManifestLocation = GitHubManifestLocation | LocalFileManifestLocation

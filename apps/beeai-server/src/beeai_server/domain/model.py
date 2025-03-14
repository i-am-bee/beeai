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

import abc
import pathlib
import uuid
from contextlib import asynccontextmanager
from enum import StrEnum
from typing import Literal

import anyio
import anyio.to_thread
from beeai_server.telemetry import OTEL_HTTP_ENDPOINT
import httpx
import yaml
from anyio import Path, CancelScope
from kink import inject
from acp import stdio_client, StdioServerParameters
from acp.client.sse import sse_client
from packaging import version
from pydantic import BaseModel, Field, FileUrl, RootModel, field_validator
from pydantic_core.core_schema import ValidationInfo

from acp.client.stdio import get_default_environment
from beeai_server.configuration import Configuration
from beeai_server.custom_types import McpClient, ID
from beeai_server.domain.constants import DEFAULT_MANIFEST_PATH
from beeai_server.exceptions import UnsupportedProviderError, MissingConfigurationError
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
    description: str | None = None
    required: bool = False


class McpTransport(StrEnum):
    sse = "sse"
    none = "none"


class BaseProvider(BaseModel, abc.ABC):
    manifestVersion: int
    mcpTransport: McpTransport = Field(default=McpTransport.sse, description="Valid for serverType http")
    mcpEndpoint: str = Field(default="/sse", description="Valid for serverType http")
    ui: list[str] = Field(default_factory=list)
    env: list[EnvVar] = Field(default_factory=list, description="For configuration -- passed to the process")

    base_file_path: str | None = None

    def check_env(self, env: dict[str, str] | None = None, raise_error: bool = True) -> list[EnvVar]:
        required_env = {var.name for var in self.env if var.required}
        all_env = {var.name for var in self.env}
        missing_env = [var for var in self.env if var.name in all_env - env.keys()]
        missing_required_env = [var for var in self.env if var.name in required_env - env.keys()]
        if missing_required_env and raise_error:
            raise MissingConfigurationError(missing_env=missing_env)
        return missing_env

    def extract_env(self, env: dict[str, str] | None = None) -> dict[str, str]:
        env = env or {}
        declared_env_vars = {var.name for var in self.env}
        return {var: env[var] for var in env if var in declared_env_vars}

    async def check_compatibility(self) -> None:
        pass

    @abc.abstractmethod
    async def mcp_client(self, *, env: dict[str, str] | None = None, with_dummy_env: bool = True) -> McpClient:
        """
        :param env: environment values passed to the process
        :param with_dummy_env: substitute all unfilled required variables from manifest by "dummy" value
        """


class UnmanagedProvider(BaseProvider):
    driver: Literal[ProviderDriver.unmanaged] = ProviderDriver.unmanaged
    serverType: Literal[ServerType.http] = ServerType.http
    env: list[EnvVar] = Field(default_factory=list, description="Not supported for unmanaged provider", max_length=0)

    @asynccontextmanager
    async def mcp_client(self, *, env: dict[str, str] | None = None, with_dummy_env: bool = True) -> McpClient:
        match (self.serverType, self.mcpTransport):
            case (ServerType.http, McpTransport.sse):
                async with sse_client(str(self.mcpEndpoint)) as client:
                    yield client
            case _:
                raise NotImplementedError(f"Transport {self.mcpTransport} not implemented")


class ManagedProvider(BaseProvider, abc.ABC):
    serverType: ServerType = ServerType.stdio
    command: list[str] = Field(description="Command with arguments to run")

    @property
    def _global_env(self) -> dict[str, str]:
        return {"OTEL_EXPORTER_OTLP_ENDPOINT": OTEL_HTTP_ENDPOINT}

    @asynccontextmanager
    async def _get_mcp_client(
        self,
        *,
        command: list[str],
        cwd: Path | None = None,
        env: dict[str, str] | None = None,
        with_dummy_env: bool = True,
    ) -> McpClient:
        required_env_vars = {var.name for var in self.env if var.required}
        env = {
            **self._global_env,
            **({var: "dummy" for var in required_env_vars} if with_dummy_env else {}),
            **(self.extract_env(env=env)),
        }
        command, args = command[0], command[1:]
        match (self.serverType, self.mcpTransport):
            case (ServerType.stdio, _):
                params = StdioServerParameters(command=command, args=args, env={**env, **get_default_environment()})
                async with stdio_client(params) as client:
                    yield client
            case (ServerType.http, McpTransport.sse):
                params = ManagedServerParameters(
                    command=command,
                    args=args,
                    cwd=pathlib.Path(cwd) if cwd else None,
                    endpoint=self.mcpEndpoint,
                    env={**env, **get_default_environment()},
                )
                async with managed_sse_client(params) as client:
                    yield client
            case _:
                raise NotImplementedError(f"Transport {self.mcpTransport} not implemented")


class NodeJsProvider(ManagedProvider):
    driver: Literal[ProviderDriver.nodejs] = ProviderDriver.nodejs
    command: list[str] = Field(default_factory=list, description="Command with arguments to run", min_length=1)
    package: str = Field(
        default=None,
        description='NPM package or "git+https://..." URL, or "file://..." URL (not allowed in remote manifests)',
    )

    async def check_compatibility(self) -> None:
        if not await which("npm"):
            raise UnsupportedProviderError("npm is not installed, see https://nodejs.org/en/download")
        await super().check_compatibility()

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
    async def mcp_client(
        self,
        *,
        env: dict[str, str] | None = None,
        with_dummy_env: bool = True,
        configuration: Configuration,
    ) -> McpClient:  # noqa: F821
        await self.check_compatibility()
        if not with_dummy_env:
            self.check_env(env)

        try:
            github_url = GithubUrl.model_validate(self.package)
            await github_url.resolve_version()
            repo_path = await download_repo(configuration.cache_dir / "github_npm", github_url)
            package_path = repo_path / (github_url.path or "")
            await anyio.run_process(["npm", "install"], cwd=package_path)
            command = ["npm", "run", *self.command]
            cwd = package_path
        except ValueError:
            command = ["npx", "-y", "--prefix", self.package, *self.command]
            cwd = None

        async with super()._get_mcp_client(
            command=command,
            cwd=cwd,
            env=env,
            with_dummy_env=with_dummy_env,
        ) as client:
            yield client


class PythonProvider(ManagedProvider):
    driver: Literal[ProviderDriver.python] = ProviderDriver.python
    pythonVersion: str | None = None
    package: str = Field(
        default=None,
        description='PyPI package or "git+https://..." URL, or "file://..." URL (not allowed in remote manifests)',
    )

    async def check_compatibility(self) -> None:
        if not await which("uvx"):
            raise UnsupportedProviderError(
                "uv is not installed, see https://docs.astral.sh/uv/getting-started/installation/"
            )
        await super().check_compatibility()

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
    async def mcp_client(self, *, env: dict[str, str] | None = None, with_dummy_env=True) -> McpClient:
        await self.check_compatibility()
        if not with_dummy_env:
            self.check_env(env)

        python = [] if not self.pythonVersion else ["--python", self.pythonVersion]
        async with super()._get_mcp_client(
            command=["uvx", *python, "--link-mode=hardlink", "--from", self.package, *self.command],
            env=env,
            with_dummy_env=with_dummy_env,
        ) as client:
            yield client


class ContainerProvider(ManagedProvider):
    driver: Literal[ProviderDriver.container] = ProviderDriver.container
    command: list[str] = Field(default_factory=list, description="Command with arguments to run")
    image: str = Field(description="Container image identifier, e.g. 'docker.io/something/here:latest'")

    _runtime = "docker"

    async def check_compatibility(self) -> None:
        if await which("docker"):
            self._runtime = "docker"
        elif await which("podman"):
            self._runtime = "podman"
        else:
            raise UnsupportedProviderError("docker is not installed, see https://docs.docker.com/get-started/")
        await super().check_compatibility()

    @asynccontextmanager
    async def mcp_client(self, *, env: dict[str, str] | None = None, with_dummy_env: bool = True) -> McpClient:  # noqa: F821
        await self.check_compatibility()
        if not with_dummy_env:
            self.check_env(env)

        env_args = [f"-e={var.name}" for var in self.env] + ["-e=PORT"] + [f"-e={var}" for var in self._global_env]
        name = uuid.uuid4().hex
        try:
            async with super()._get_mcp_client(
                command=[
                    self._runtime,
                    "run",
                    "--rm",
                    "-i",
                    *env_args,
                    "--network=host",
                    f"--name={name}",
                    self.image,
                    *self.command,
                ],
                env=env,
                with_dummy_env=with_dummy_env,
            ) as client:
                yield client
        finally:
            with CancelScope(shield=True):
                await anyio.run_process(command=[self._runtime, "kill", name], check=False)


ProviderManifest = UnmanagedProvider | NodeJsProvider | PythonProvider | ContainerProvider


class Provider(BaseModel, extra="allow"):
    manifest: ProviderManifest
    id: ID
    registry: GithubUrl | None = None

    @asynccontextmanager
    async def mcp_client(self, *, env: dict[str, str] | None = None, with_dummy_env: bool = True) -> McpClient:
        async with self.manifest.mcp_client(env=env, with_dummy_env=with_dummy_env) as client:
            yield client


class LoadedProviderStatus(StrEnum):
    initializing = "initializing"
    ready = "ready"
    error = "error"
    unsupported = "unsupported"


class LoadProviderErrorMessage(BaseModel):
    message: str


class ProviderWithStatus(Provider):
    status: LoadedProviderStatus
    last_error: LoadProviderErrorMessage | None = None
    missing_configuration: list[EnvVar] = Field(default_factory=list)


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
            self.root.path = f"{self.root.path}/{DEFAULT_MANIFEST_PATH}" if self.root.path else DEFAULT_MANIFEST_PATH
        await self.root.resolve_version()
        self._resolved = True

    async def load(self) -> ProviderManifest:
        await self.resolve()
        async with httpx.AsyncClient(
            headers={"Cache-Control": "no-cache, no-store, must-revalidate", "Pragma": "no-cache", "Expires": "0"}
        ) as client:
            resp = await client.get(str(self.root.get_raw_url(self.root.path or DEFAULT_MANIFEST_PATH)))
            resp.raise_for_status()
        return RootModel[ProviderManifest].model_validate(yaml.safe_load(resp.text)).root

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

    async def load(self) -> ProviderManifest:
        await self.resolve()
        path = Path(self.root.path)
        content = await path.read_text()
        return (
            RootModel[ProviderManifest]
            .model_validate({**yaml.safe_load(content), "base_file_path": str(path.parent)})
            .root
        )

    def __str__(self):
        return str(self.root)


ManifestLocation = GitHubManifestLocation | LocalFileManifestLocation

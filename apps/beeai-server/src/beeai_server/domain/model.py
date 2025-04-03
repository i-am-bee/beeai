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
import base64
import logging
from contextlib import asynccontextmanager, suppress
from datetime import timedelta
from enum import StrEnum
from typing import Literal, Optional, Self, Any

import httpx
import yaml
from aiodocker import DockerError

from acp.client.sse import sse_client
from beeai_server.adapters.interface import IContainerBackend
from beeai_server.configuration import Configuration
from beeai_server.custom_types import ID, McpClient
from beeai_server.domain.constants import DEFAULT_MANIFEST_PATH, DOCKER_MANIFEST_LABEL_NAME, LOCAL_IMAGE_REGISTRY
from beeai_server.exceptions import MissingConfigurationError, retry_if_exception_grp_type
from beeai_server.telemetry import OTEL_HTTP_ENDPOINT
from beeai_server.utils.docker import DockerImageID, get_registry_image_config_and_labels, replace_localhost_url
from beeai_server.utils.github import ResolvedGithubUrl, GithubUrl
from beeai_server.utils.logs_container import LogsContainer
from beeai_server.utils.process import find_free_port
from httpx import HTTPError
from kink import inject
from pydantic import BaseModel, Field, PrivateAttr, computed_field, RootModel, AnyUrl
from tenacity import AsyncRetrying, stop_after_attempt, wait_exponential


class EnvVar(BaseModel):
    name: str
    description: str | None = None
    required: bool = False


class AgentManifest(BaseModel, extra="allow"):
    manifestVersion: Literal[1] = 1
    name: str
    ui: dict[str, Any] | None = None
    env: list[EnvVar] = Field(default_factory=list, description="For configuration -- passed to the process")


logger = logging.getLogger(__name__)


class LoadedProviderStatus(StrEnum):
    not_installed = "not_installed"
    install_error = "install_error"
    installing = "installing"
    starting = "starting"
    ready = "ready"
    running = "running"
    error = "error"


class LoadProviderErrorMessage(BaseModel):
    message: str


class GithubProviderSource(BaseModel):
    location: ResolvedGithubUrl

    _resolved: bool = PrivateAttr(False)

    @computed_field
    @property
    def id(self) -> str:
        return str(self.location)

    @property
    def image_id(self) -> DockerImageID:
        tag = f"{LOCAL_IMAGE_REGISTRY}/{self.location.org}/{self.location.repo}:{self.location.version}"
        return DockerImageID(root=tag)

    @inject
    async def install(self, container_backend: IContainerBackend, logs_container: LogsContainer | None = None):
        await container_backend.build_from_github(
            github_url=self.location, destination=self.image_id, logs_container=logs_container
        )

    @inject
    async def uninstall(self, container_backend: IContainerBackend):
        await container_backend.delete_image(image=self.image_id)

    @inject
    async def is_installed(self, container_backend: IContainerBackend) -> bool:
        return await container_backend.check_image(image=self.image_id)

    async def load_manifest(self) -> AgentManifest:
        async with httpx.AsyncClient(
            headers={"Cache-Control": "no-cache, no-store, must-revalidate", "Pragma": "no-cache", "Expires": "0"}
        ) as client:
            resp = await client.get(str(self.location.get_raw_url(self.location.path or DEFAULT_MANIFEST_PATH)))
            resp.raise_for_status()
        return AgentManifest.model_validate(yaml.safe_load(resp.text))

    def __str__(self):
        return str(self.location)


class DockerImageProviderSource(BaseModel):
    location: DockerImageID

    @computed_field
    @property
    def id(self) -> str:
        return str(self.location)

    @property
    def image_id(self) -> DockerImageID:
        return self.location

    async def load_manifest(self) -> AgentManifest:
        full_config, labels = await get_registry_image_config_and_labels(self.location)
        if DOCKER_MANIFEST_LABEL_NAME not in labels:
            raise ValueError(f"Docker image labels must contain 'beeai.dev.agent.yaml': {self.location}")
        return AgentManifest.model_validate(yaml.safe_load(base64.b64decode(labels[DOCKER_MANIFEST_LABEL_NAME])))

    @inject
    async def install(self, container_backend: IContainerBackend, logs_container: LogsContainer | None = None):
        await container_backend.pull_image(image=self.location, logs_container=logs_container)

    @inject
    async def uninstall(self, container_backend: IContainerBackend):
        await container_backend.delete_image(image=self.image_id)

    @inject
    async def is_installed(self, container_backend: IContainerBackend) -> bool:
        return await container_backend.check_image(image=self.image_id)

    def __str__(self):
        return str(self.location)


ProviderSource = GithubProviderSource | DockerImageProviderSource


class GithubProviderLocation(RootModel):
    root: GithubUrl

    async def resolve(self) -> GithubProviderSource:
        return GithubProviderSource(location=await self.root.resolve_version())


class DockerImageProviderLocation(RootModel):
    root: DockerImageID

    async def resolve(self) -> DockerImageProviderSource:
        return DockerImageProviderSource(location=self.root)


ProviderLocation = GithubProviderLocation | DockerImageProviderLocation


class BaseProvider(BaseModel, abc.ABC):
    id: ID
    manifest: AgentManifest
    auto_stop_timeout: timedelta | None = Field(exclude=True)

    def check_env(self, env: dict[str, str] | None = None, raise_error: bool = True) -> list[EnvVar]:
        required_env = {var.name for var in self.manifest.env if var.required}
        all_env = {var.name for var in self.manifest.env}
        missing_env = [var for var in self.manifest.env if var.name in all_env - env.keys()]
        missing_required_env = [var for var in self.manifest.env if var.name in required_env - env.keys()]
        if missing_required_env and raise_error:
            raise MissingConfigurationError(missing_env=missing_env)
        return missing_env

    def extract_env(self, env: dict[str, str] | None = None) -> dict[str, str]:
        env = env or {}
        declared_env_vars = {var.name for var in self.manifest.env}
        return {var: env[var] for var in env if var in declared_env_vars}

    async def is_installed(self) -> bool:
        return True

    async def install(self, logs_container: LogsContainer | None = None):
        pass

    async def uninstall(self):
        pass

    @abc.abstractmethod
    async def mcp_client(
        self,
        *,
        env: dict[str, str] | None = None,
        with_dummy_env: bool = True,
        logs_container: Optional["LogsContainer"] = None,
    ) -> McpClient:
        """
        :param env: environment values passed to the process
        :param with_dummy_env: substitute all unfilled required variables from manifest by "dummy" value
        :param logs_container: capture logs of the provider process (if managed)
        """


class ManagedProvider(BaseProvider, extra="allow"):
    source: ProviderSource
    registry: ResolvedGithubUrl | None = None
    auto_stop_timeout: timedelta | None = Field(timedelta(minutes=5), exclude=True)

    @classmethod
    async def load_from_source(cls, source: ProviderSource, registry: ResolvedGithubUrl | None = None) -> Self:
        manifest = await source.load_manifest()
        return cls(manifest=manifest, source=source, id=str(source), registry=registry)

    @computed_field
    @property
    def image_id(self) -> DockerImageID:
        return self.source.image_id

    async def is_installed(self) -> bool:
        return await self.source.is_installed()

    async def install(self, logs_container: LogsContainer | None = None):
        if await self.source.is_installed():
            return
        await self.source.install(logs_container=logs_container)

    async def uninstall(self):
        with suppress(DockerError):
            await self.source.uninstall()

    @property
    def _global_env(self) -> dict[str, str]:
        return {
            "OTEL_EXPORTER_OTLP_ENDPOINT": replace_localhost_url(OTEL_HTTP_ENDPOINT),
            "PLATFORM_URL": "host.docker.internal:8333",
        }

    @asynccontextmanager
    @inject
    async def mcp_client(
        self,
        *,
        configuration: Configuration,
        container_backend: IContainerBackend,
        env: dict[str, str] | None = None,
        with_dummy_env: bool = True,
        logs_container: LogsContainer | None = None,
    ) -> McpClient:
        if not with_dummy_env:
            self.check_env(env)

        required_env_vars = {var.name for var in self.manifest.env if var.required}
        env = {
            **self._global_env,
            **({var: "dummy" for var in required_env_vars} if with_dummy_env else {}),
            **(self.extract_env(env=env)),
        }
        port = str(await find_free_port())

        async with container_backend.open_container(
            image=self.image_id,
            port_mappings={port: "8000"},
            env={"PORT": "8000", "HOST": "0.0.0.0", **env},
            logs_container=logs_container,
        ):
            async for attempt in AsyncRetrying(
                stop=stop_after_attempt(8),
                wait=wait_exponential(multiplier=1, max=3),
                retry=retry_if_exception_grp_type(HTTPError),
                reraise=True,
            ):
                with attempt:
                    async with sse_client(url=f"http://localhost:{port}/sse", timeout=60) as streams:
                        yield streams


class UnmanagedProvider(BaseProvider, extra="allow"):
    location: AnyUrl

    @asynccontextmanager
    @inject
    async def mcp_client(self, *_args, **_kwargs) -> McpClient:
        location = str(self.location).rstrip("/")
        async with sse_client(url=f"{location}/sse", timeout=60) as streams:
            yield streams


class ProviderWithStatus(BaseModel, extra="allow"):
    status: LoadedProviderStatus
    last_error: LoadProviderErrorMessage | None = None
    missing_configuration: list[EnvVar] = Field(default_factory=list)

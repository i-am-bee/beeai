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

import asyncio
import base64
import logging
from asyncio import CancelledError
from contextlib import asynccontextmanager, suppress, AsyncExitStack
from typing import Iterable, AsyncGenerator

import aiohttp
import anyio
import anyio.to_thread
import httpx
from aiodocker import Docker, DockerError
from aiohttp.web_exceptions import HTTPError
from tenacity import AsyncRetrying, retry_if_exception_type

from beeai_server.adapters.interface import IContainerBackend
from beeai_server.configuration import Configuration, OCIRegistryConfiguration
from beeai_server.custom_types import ID
from beeai_server.domain.constants import DOCKER_MANIFEST_LABEL_NAME
from beeai_server.utils.docker import DockerImageID, replace_localhost_url
from beeai_server.utils.github import ResolvedGithubUrl
from beeai_server.utils.logs_container import LogsContainer
from kink import inject


logger = logging.getLogger(__name__)


@inject
class DockerContainerBackend(IContainerBackend):
    def __init__(self, *, docker_host: str, configuration: Configuration) -> None:
        self.configuration = configuration
        self._docker_host = docker_host

    def _get_auth_header(self, destination: DockerImageID) -> dict | None:
        config: OCIRegistryConfiguration = self.configuration.oci_registry[destination.registry]
        return config.basic_auth_str and {"auth": config.basic_auth_str}

    async def build_from_github(
        self,
        *,
        github_url: ResolvedGithubUrl,
        destination: DockerImageID | None = None,
        logs_container: LogsContainer | None = None,
    ) -> DockerImageID:
        path = f":{github_url.path}" if github_url.path else ""
        tag = (
            str(destination)
            if destination
            else f"{github_url.org}/{github_url.repo}/{github_url.path}:{github_url.version}"
        )
        remote = f"https://github.com/{github_url.org}/{github_url.repo}.git#{github_url.version}{path}"
        path = f"{github_url.path}/agent.yaml" if github_url.path else "agent.yaml"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url=str(github_url.get_raw_url(path)))
            labels = {DOCKER_MANIFEST_LABEL_NAME: base64.b64encode(resp.content).decode()}
        async with self._docker as docker:
            if logs_container:
                async for message in docker.images.build(remote=remote, tag=tag, labels=labels, stream=True):
                    text = message["stream"] if "stream" in message else str(message)
                    if text.strip():
                        logs_container.add_stdout(text)
            else:
                await docker.images.build(remote=remote, tag=tag, labels=labels)
        return DockerImageID(root=tag)

    async def check_image(self, *, image: DockerImageID) -> bool:
        async with self._docker as docker:
            with suppress(DockerError):
                await docker.images.inspect(str(image))
                return True
            return False

    async def extract_labels(self, *, image: DockerImageID) -> dict[str, str]:
        async with self._docker as docker:
            with suppress(DockerError):
                image_info = await docker.images.inspect(str(image))
                image_info
            return False

    async def delete_image(self, *, image: DockerImageID):
        async with self._docker as docker:
            await docker.images.delete(str(image), force=True)

    async def pull_image(self, *, image: DockerImageID, logs_container: LogsContainer | None = None):
        async with self._docker as docker:
            if logs_container:
                progress = {}
                async for message in docker.pull(str(image), auth=self._get_auth_header(image), stream=True):
                    status = message["status"]
                    if progress_detail := message.get("progressDetail", None):
                        id = message["id"]
                        if (id, status) not in progress:
                            logs_container.add_stdout(f"{id}: {status}")
                        progress[(id, status)] = progress_detail
                    else:
                        id_msg = f"{message['id']}: " if "id" in message else ""
                        logs_container.add_stdout(f"{id_msg}{status}")
            else:
                await docker.pull(str(image), auth=self._get_auth_header(image))

    @property
    def _docker(self) -> Docker:
        docker = Docker(self._docker_host, session=AsyncExitStack())
        return Docker(
            url=self._docker_host,
            session=aiohttp.ClientSession(connector=docker.connector, timeout=aiohttp.ClientTimeout(sock_connect=30)),
        )

    async def stream_logs(self, container_id: ID, logs_container: LogsContainer):
        async for attempt in AsyncRetrying(retry=retry_if_exception_type(HTTPError), reraise=True):
            with attempt:
                async with self._docker as docker:
                    container = await docker.containers.get(container_id)
                    async for log_message in container.log(stdout=True, stderr=True, follow=True):
                        if log_message := log_message.strip():
                            logs_container.add_stdout(log_message)

    @asynccontextmanager
    async def open_container(
        self,
        *,
        image: DockerImageID,
        name: str | None = None,
        command: list[str] | None = None,
        volumes: Iterable[str] | None = None,
        env: dict[str, str] | None = None,
        port_mappings: dict[str, str] | None = None,
        logs_container: LogsContainer | None = None,
        restart: str | None = None,
    ) -> AsyncGenerator[ID, None]:
        # Dirty networking fix
        env = env or {}
        env = {key: replace_localhost_url(val) for key, val in env.items()}

        container_id = None
        logs_streaming_task = None

        try:
            async with self._docker as docker:
                name = name or image.repository.replace("/", "-")
                config = {"Image": str(image), "HostConfig": {}}
                if volumes:
                    config["HostConfig"]["Binds"] = list(volumes) or []
                if restart:
                    restart_type, count = (restart if ":" in restart else f"{restart}:0").split(":")
                    config["HostConfig"]["RestartPolicy"] = {"Name": restart_type, "MaximumRetryCount": int(count)}
                if env:
                    config["Env"] = [f"{var}={value}" for var, value in env.items()]
                if command:
                    config["Cmd"] = command
                if port_mappings:
                    config["ExposedPorts"] = {f"{port}/tcp": {} for port in port_mappings.values()}
                    config["HostConfig"]["PortBindings"] = {
                        f"{container_port}/tcp": [{"HostIp": "0.0.0.0", "HostPort": str(host_port)}]
                        for host_port, container_port in port_mappings.items()
                    }
                container = await docker.containers.create_or_replace(name=name, config=config)
                await container.start()
                container_id = container.id
                if logs_container:
                    logs_streaming_task = asyncio.create_task(self.stream_logs(container_id, logs_container))

                yield container_id
        finally:
            with anyio.CancelScope(shield=True):
                if container_id:
                    await _cancel_task(logs_streaming_task)
                    async with self._docker as docker:
                        container = await docker.containers.get(name)
                        await container.delete(force=True)


async def _cancel_task(task: asyncio.Task[None] | None):
    if task:
        task.cancel()
        with suppress(CancelledError):
            await task

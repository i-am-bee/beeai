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
import concurrent.futures
import json
import logging
import shlex
import subprocess
from contextlib import suppress

import anyio

from acp.server.sse import SseServerTransport
from beeai_server.adapters.docker import DockerContainerBackend
from beeai_server.adapters.filesystem import (
    FilesystemEnvVariableRepository,
    FilesystemProviderRepository,
    FilesystemTelemetryRepository,
)
from beeai_server.adapters.interface import (
    IContainerBackend,
    IEnvVariableRepository,
    IProviderRepository,
    ITelemetryRepository,
)
from beeai_server.configuration import Configuration, get_configuration
from beeai_server.domain.telemetry import TelemetryCollectorManager
from beeai_server.services.mcp_proxy.provider import ProviderContainer
from beeai_server.utils.periodic import register_all_crons
from kink import di

logging.getLogger(__name__)


async def cmd(command: str):
    process = await anyio.run_process(command, check=True)
    return process.stdout.decode("utf-8").strip()


async def _get_docker_host(configuration: Configuration):
    if not configuration.force_lima:
        if configuration.docker_host:
            with suppress(subprocess.CalledProcessError):
                logging.info("Trying DOCKER_HOST...")
                await cmd(f"test -e {shlex.quote(configuration.docker_host)}")
                return configuration.docker_host
        with suppress(subprocess.CalledProcessError):
            logging.info("Trying Docker...")
            docker_url = await cmd(
                'docker context inspect "$(docker context show)" --format "{{.Endpoints.docker.Host}}"'
            )
            await cmd(f"test -e {shlex.quote(docker_url.removeprefix('unix://'))}")
            return docker_url
        with suppress(subprocess.CalledProcessError):
            logging.info("Trying Podman Machine...")
            podman_url = await cmd('podman machine inspect --format "{{.ConnectionInfo.PodmanSocket.Path}}"')
            await cmd(f"test -e {shlex.quote(podman_url)}")
            return f"unix://{podman_url}"
        with suppress(subprocess.CalledProcessError):
            logging.info("Trying Podman...")
            podman_url = await cmd('podman info --format "{{.Host.RemoteSocket.Path}}"')
            await cmd(f"test -e {shlex.quote(podman_url)}")
            return f"unix://{podman_url}"

    with suppress(subprocess.CalledProcessError):
        logging.info("Trying Lima...")
        lima_instance = next(
            (
                instance
                for line in (
                    (await cmd("limactl --tty=false list --format=json")).split("\n")
                )  # it actually prints JSONL (one JSON object per line)
                if line
                if (instance := json.loads(line))
                if instance["name"] == "beeai"
            ),
            None,
        )
        if not lima_instance:
            logging.info("BeeAI VM not found, creating...")
            await cmd("limactl --tty=false start template://docker-rootful --name beeai")
        logging.info("Starting BeeAI VM...")
        await cmd("limactl --tty=false start beeai")
        await cmd("limactl --tty=false start-at-login beeai")
        lima_home = json.loads(await cmd("limactl --tty=false info"))["limaHome"]
        return f"unix://{lima_home}/beeai/sock/docker.sock"

    if configuration.force_lima:
        raise ValueError(
            "Could not start the Lima VM. Please ensure that Lima is properly installed (https://lima-vm.io/docs/installation/)."
        )
    raise ValueError(
        "No compatible container runtime found. Please install Lima (https://lima-vm.io/docs/installation/) or a supported container runtime (Docker, Rancher, Podman, ...)."
    )


async def resolve_container_runtime_cmd(configuration: Configuration) -> IContainerBackend:
    docker_host = await _get_docker_host(configuration)
    backend = DockerContainerBackend(docker_host=docker_host, configuration=configuration)
    await backend.configure_host_docker_internal()
    return backend


async def bootstrap_dependencies():
    di.clear_cache()
    di._aliases.clear()  # reset aliases
    di[Configuration] = get_configuration()
    di[IProviderRepository] = FilesystemProviderRepository(provider_config_path=di[Configuration].provider_config_path)
    di[IEnvVariableRepository] = FilesystemEnvVariableRepository(env_variable_path=di[Configuration].env_path)
    di[ITelemetryRepository] = FilesystemTelemetryRepository(
        telemetry_config_path=di[Configuration].telemetry_config_path
    )
    di[IContainerBackend] = await resolve_container_runtime_cmd(di[Configuration])
    di[SseServerTransport] = SseServerTransport("/mcp/messages/")  # global SSE transport
    di[ProviderContainer] = ProviderContainer()
    di[TelemetryCollectorManager] = TelemetryCollectorManager()

    # Ensure cache directory
    await anyio.Path(di[Configuration].cache_dir).mkdir(parents=True, exist_ok=True)

    register_all_crons()


def bootstrap_dependencies_sync():
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(lambda: asyncio.run(bootstrap_dependencies()))
        return future.result()

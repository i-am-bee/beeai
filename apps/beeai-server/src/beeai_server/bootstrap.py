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
import subprocess
from contextlib import suppress
from pathlib import Path

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

import time

logger = logging.getLogger(__name__)


def cmd(command: str) -> str:
    logger.info(f"Running command: `{command}`")
    process = subprocess.run(command, shell=True, capture_output=True, text=True, check=False)
    stdout = process.stdout
    stderr = process.stderr
    logger.info(
        f"Command `{command}` completed with exit_code={process.returncode}"
        + (f" stdout={repr(stdout)}" if stdout else "")
        + (f" stderr={repr(stderr)}" if stderr else "")
    )
    process.check_returncode()
    return stdout


def _get_docker_host(configuration: Configuration):
    if not configuration.force_lima:
        if configuration.docker_host:
            if Path(configuration.docker_host).is_socket():
                return configuration.docker_host
            logger.warning(f"Invalid DOCKER_HOST={configuration.docker_host}, trying other options...")
        with suppress(subprocess.CalledProcessError):
            logger.info("Trying Docker...")
            docker_url = cmd(
                'docker context inspect "$(docker context show)" --format "{{.Endpoints.docker.Host}}"'
            ).strip()
            docker_path = docker_url.removeprefix("unix://")
            if Path(docker_path).is_socket():
                return docker_url
        with suppress(subprocess.CalledProcessError):
            logger.info("Trying Podman Machine...")
            podman_url = cmd('podman machine inspect --format "{{.ConnectionInfo.PodmanSocket.Path}}"').strip()
            if Path(podman_url).is_socket():
                return f"unix://{podman_url}"
        with suppress(subprocess.CalledProcessError):
            logger.info("Trying Podman...")
            podman_url = cmd('podman info --format "{{.Host.RemoteSocket.Path}}"').strip()
            if Path(podman_url).is_socket():
                return f"unix://{podman_url}"

    with suppress(subprocess.CalledProcessError):
        logger.info("Trying Lima...")
        lima_instance = next(
            (
                instance
                for line in cmd("limactl --tty=false list --format=json").split("\n")
                if line
                if (instance := json.loads(line))
                if instance["name"] == "beeai"
            ),
            None,
        )
        if not lima_instance:
            logger.info("BeeAI VM not found, creating...")
            cmd("limactl --tty=false start template://docker-rootful --name beeai")
        logger.info("Starting BeeAI VM...")
        cmd("limactl --tty=false start beeai")
        cmd("limactl --tty=false start-at-login beeai")
        cmd("limactl --tty=false protect beeai")
        lima_home = json.loads(cmd("limactl --tty=false info"))["limaHome"]
        socket_path = Path(f"{lima_home}/beeai/sock/docker.sock")

        logger.info(f"Waiting up to 60 seconds for Lima socket {socket_path}...")
        timeout = time.time() + 60
        while time.time() < timeout:
            if socket_path.is_socket():
                break
            time.sleep(0.5)
        if not socket_path.is_socket():
            raise ValueError(f"Lima socket {socket_path} did not appear within 60 seconds.")
        return f"unix://{socket_path}"

    if configuration.force_lima:
        raise ValueError(
            "Could not start the Lima VM. Please ensure that Lima is properly installed (https://lima-vm.io/docs/installation/)."
        )
    raise ValueError(
        "No compatible container runtime found. Please install Lima (https://lima-vm.io/docs/installation/) or a supported container runtime (Docker, Rancher, Podman, ...)."
    )


async def resolve_container_runtime_cmd(configuration: Configuration) -> IContainerBackend:
    docker_host = _get_docker_host(configuration)
    logger.info(f"Using DOCKER_HOST={docker_host}")
    backend = DockerContainerBackend(docker_host=docker_host, configuration=configuration)
    if not docker_host.endswith("lima/beeai/sock/docker.sock"):
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

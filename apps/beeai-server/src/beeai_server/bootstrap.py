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

import logging
import subprocess
from contextlib import suppress

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


def cmd(command: str):
    process = subprocess.run(command, shell=True, capture_output=True, text=True, check=True)
    return process.stdout.strip()


def resolve_container_runtime_cmd(configuration: Configuration) -> IContainerBackend:
    if configuration.docker_host:
        return DockerContainerBackend(docker_host=configuration.docker_host)

    with suppress(subprocess.CalledProcessError):
        docker_url = cmd('docker context inspect "$(docker context show)" --format "{{.Endpoints.docker.Host}}"')
        return DockerContainerBackend(docker_host=docker_url)

    with suppress(subprocess.CalledProcessError):
        podman_url = cmd('podman machine inspect --format "{{.ConnectionInfo.PodmanSocket.Path}}"')
        return DockerContainerBackend(docker_host=f"unix://{podman_url}")
    with suppress(subprocess.CalledProcessError):
        podman_url = cmd('podman info --format "{{.Host.RemoteSocket.Path}}"')
        return DockerContainerBackend(docker_host=f"unix://{podman_url}")

    raise ValueError("No supported container runtime found, install docker or podman in docker compatibility mode")


def bootstrap_dependencies():
    di.clear_cache()
    di._aliases.clear()  # reset aliases
    di[Configuration] = get_configuration()
    di[IProviderRepository] = FilesystemProviderRepository(provider_config_path=di[Configuration].provider_config_path)
    di[IEnvVariableRepository] = FilesystemEnvVariableRepository(env_variable_path=di[Configuration].env_path)
    di[ITelemetryRepository] = FilesystemTelemetryRepository(
        telemetry_config_path=di[Configuration].telemetry_config_path
    )
    di[IContainerBackend] = resolve_container_runtime_cmd(di[Configuration])
    di[SseServerTransport] = SseServerTransport("/mcp/messages/")  # global SSE transport
    di[ProviderContainer] = ProviderContainer()
    di[TelemetryCollectorManager] = TelemetryCollectorManager()

    # Ensure cache directory
    di[Configuration].cache_dir.mkdir(parents=True, exist_ok=True)

    register_all_crons()

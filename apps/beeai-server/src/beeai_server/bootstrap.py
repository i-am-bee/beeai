# Copyright 2025 © BeeAI a Series of LF Projects, LLC
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
import platform
import shutil
import subprocess
import time
from contextlib import suppress, AsyncExitStack
from pathlib import Path
import socket
import http.client
import urllib.parse
import ssl

import anyio
import anyio.to_thread
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
from beeai_server.domain.collector.constants import TELEMETRY_BASE_CONFIG_PATH, TELEMETRY_BEEAI_CONFIG_PATH
from beeai_server.domain.provider.container import ProviderContainer
from beeai_server.domain.telemetry import TelemetryCollectorManager
from beeai_server.utils.periodic import register_all_crons
from kink import di

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


def is_valid_docker_host(docker_host: str) -> bool:
    try:
        parsed = urllib.parse.urlparse(docker_host)
        if parsed.scheme == "unix":
            with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as sock:
                sock.settimeout(2)
                sock.connect(parsed.path)
                conn = http.client.HTTPConnection("localhost")
                conn.sock = sock
                conn.request("GET", "/version")
                return conn.getresponse().status == 200
        host = parsed.hostname
        port = parsed.port or (2376 if parsed.scheme == "https" else 2375)
        conn_class = http.client.HTTPSConnection if parsed.scheme == "https" else http.client.HTTPConnection
        context = ssl._create_unverified_context() if parsed.scheme == "https" else None
        conn = conn_class(host, port, timeout=2, context=context)
        conn.request("GET", "/version")
        return conn.getresponse().status == 200
    except Exception:
        return False


def get_docker_host(configuration: Configuration):
    is_wsl = "wsl2" in platform.uname().release.lower()

    if not configuration.force_lima or is_wsl:  # Lima does not support WSL (yet), so we ignore FORCE_LIMA
        if configuration.docker_host:
            if is_valid_docker_host(configuration.docker_host):
                return configuration.docker_host
            logger.warning(f"Invalid DOCKER_HOST={configuration.docker_host}, trying other options...")
        with suppress(subprocess.CalledProcessError):
            logger.info("Trying Docker...")
            socket_url = cmd(
                'docker context inspect "$(docker context show)" --format "{{.Endpoints.docker.Host}}"'
            ).strip()
            if is_valid_docker_host(socket_url):
                return socket_url
        with suppress(subprocess.CalledProcessError):
            logger.info("Trying Podman Machine...")
            socket_url = (
                "unix://" + cmd('podman machine inspect --format "{{.ConnectionInfo.PodmanSocket.Path}}"').strip()
            )
            if is_valid_docker_host(socket_url):
                return socket_url
        with suppress(subprocess.CalledProcessError):
            logger.info("Trying Podman...")
            socket_url = "unix://" + cmd('podman info --format "{{.Host.RemoteSocket.Path}}"').strip()
            if is_valid_docker_host(socket_url):
                return socket_url

        logger.info("Trying default socket location...")
        socket_url = "unix:///var/run/docker.sock"
        if is_valid_docker_host(socket_url):
            return socket_url

    if is_wsl:
        raise ValueError(
            "No compatible container runtime found. Please follow the Windows setup instructions in the installation guide (https://docs.beeai.dev/introduction/installation)."
        )

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
    docker_host = get_docker_host(configuration)
    logger.info(f"Using DOCKER_HOST={docker_host}")
    backend = DockerContainerBackend(docker_host=docker_host, configuration=configuration)
    if not docker_host.endswith("lima/beeai/sock/docker.sock"):
        await backend.configure_host_docker_internal()
    return backend


def copy_telemetry_config(config: Configuration) -> IContainerBackend:
    config.telemetry_config_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy(TELEMETRY_BASE_CONFIG_PATH, config.telemetry_config_dir / "base.yaml")
    shutil.copy(TELEMETRY_BEEAI_CONFIG_PATH, config.telemetry_config_dir / "beeai.yaml")


async def bootstrap_dependencies():
    """
    Disclaimer:
        contains blocking calls, but it's fine because this function should run only during startup
        it is async only because it needs to call other async code
    """

    di.clear_cache()
    di._aliases.clear()  # reset aliases

    di[Configuration] = config = get_configuration()

    copy_telemetry_config(config)

    di[IProviderRepository] = FilesystemProviderRepository(provider_config_path=config.provider_config_path)
    di[IEnvVariableRepository] = FilesystemEnvVariableRepository(env_variable_path=config.env_path)
    di[ITelemetryRepository] = FilesystemTelemetryRepository(
        telemetry_config_path=config.telemetry_config_dir / "telemetry.yaml"
    )

    di[IContainerBackend] = NotImplemented if config.disable_docker else await resolve_container_runtime_cmd(config)
    di[TelemetryCollectorManager] = AsyncExitStack() if not config.collector_managed else TelemetryCollectorManager()

    di[ProviderContainer] = ProviderContainer(
        env_repository=di[IEnvVariableRepository], autostart_providers=config.autostart_providers
    )

    # Ensure cache directory
    await anyio.Path(config.cache_dir).mkdir(parents=True, exist_ok=True)
    register_all_crons()


def bootstrap_dependencies_sync():
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(lambda: asyncio.run(bootstrap_dependencies()))
        return future.result()

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

from beeai_server.domain.telemetry import TelemetryCollectorManager
from kink import di
from acp.server.sse import SseServerTransport

from beeai_server.adapters.filesystem import (
    FilesystemProviderRepository,
    FilesystemEnvVariableRepository,
    FilesystemTelemetryRepository,
)
from beeai_server.adapters.interface import ITelemetryRepository, IProviderRepository, IEnvVariableRepository
from beeai_server.configuration import Configuration, get_configuration
from beeai_server.services.mcp_proxy.provider import ProviderContainer
from beeai_server.utils.periodic import register_all_crons


def bootstrap_dependencies():
    di.clear_cache()
    di._aliases.clear()  # reset aliases
    di[Configuration] = get_configuration()
    di[IProviderRepository] = FilesystemProviderRepository(provider_config_path=di[Configuration].provider_config_path)
    di[IEnvVariableRepository] = FilesystemEnvVariableRepository(env_variable_path=di[Configuration].env_path)
    di[ITelemetryRepository] = FilesystemTelemetryRepository(
        telemetry_config_path=di[Configuration].telemetry_config_path
    )
    di[SseServerTransport] = SseServerTransport("/mcp/messages/")  # global SSE transport
    di[ProviderContainer] = ProviderContainer()
    di[TelemetryCollectorManager] = TelemetryCollectorManager()

    # Ensure cache directory
    di[Configuration].cache_dir.mkdir(parents=True, exist_ok=True)

    register_all_crons()

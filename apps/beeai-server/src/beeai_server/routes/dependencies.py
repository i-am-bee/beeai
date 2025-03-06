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

from typing import Annotated

from beeai_server.configuration import Configuration
from beeai_server.services.env import EnvService
from beeai_server.services.mcp_proxy.proxy_server import MCPProxyServer
from beeai_server.services.telemetry import TelemetryService
from fastapi import Depends
from kink import di

from beeai_server.services.provider import ProviderService
from acp.server.sse import SseServerTransport

ConfigurationDependency = Annotated[Configuration, Depends(lambda: di[Configuration])]
ProviderServiceDependency = Annotated[ProviderService, Depends(lambda: di[ProviderService])]
EnvServiceDependency = Annotated[EnvService, Depends(lambda: di[EnvService])]
TelemetryServiceDependency = Annotated[TelemetryService, Depends(lambda: di[TelemetryService])]
SSEServerTransportDependency = Annotated[SseServerTransport, Depends(lambda: di[SseServerTransport])]
MCPProxyServerDependency = Annotated[MCPProxyServer, Depends(lambda: di[MCPProxyServer])]

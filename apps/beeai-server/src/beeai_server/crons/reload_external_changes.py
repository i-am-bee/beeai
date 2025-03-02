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
from datetime import timedelta

from kink import inject

from beeai_server.services.env import EnvService
from beeai_server.services.provider import ProviderService
from beeai_server.services.telemetry import TelemetryService
from beeai_server.utils.periodic import periodic

logger = logging.getLogger(__name__)


@periodic(period=timedelta(minutes=1))
@inject
async def reload_providers(
    provider_service: ProviderService, env_service: EnvService, telemetry_service: TelemetryService
):
    """
    Periodically external changes to providers and environment variables.

    Useful when ~/.beeai/.env or ~/.beeai/providers.yaml is modified manually
    """
    await env_service.sync()
    await provider_service.sync()
    await telemetry_service.sync()

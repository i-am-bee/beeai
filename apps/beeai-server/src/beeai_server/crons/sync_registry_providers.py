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

import httpx
import yaml
from kink import inject

from beeai_server.configuration import Configuration
from beeai_server.schema import CreateProviderRequest, DeleteProviderRequest
from beeai_server.services.provider import ProviderService
from beeai_server.utils.periodic import periodic

logger = logging.getLogger(__name__)


@periodic(period=timedelta(minutes=5))
@inject
async def check_official_registry(configuration: Configuration, provider_service: ProviderService):
    registry = configuration.provider_registry_location
    await registry.resolve_version()
    managed_providers = {
        provider.id for provider in await provider_service.list_providers() if provider.registry == registry
    }
    errors = []
    desired_providers = set()

    async with httpx.AsyncClient(
        headers={"Cache-Control": "no-cache, no-store, must-revalidate", "Pragma": "no-cache", "Expires": "0"}
    ) as client:
        resp = await client.get(str(registry.get_raw_url()))
        resp = yaml.safe_load(resp.content)["providers"]
        for provider in resp:
            try:
                provider_manifest = CreateProviderRequest(location=provider["url"]).location
                await provider_manifest.resolve()
                desired_providers.add(provider_manifest.provider_id)
            except ValueError as e:
                errors.append(e)

    new_providers = desired_providers - managed_providers
    old_providers = managed_providers - desired_providers
    for provider in new_providers:
        try:
            location = CreateProviderRequest(location=provider).location
            await provider_service.add_provider(location=location, registry=registry)
            logger.info(f"Added provider {provider}")
        except Exception as ex:
            errors.append(ex)

    for provider in old_providers:
        try:
            location = DeleteProviderRequest(location=provider).location
            await provider_service.delete_provider(location=location)
            logger.info(f"Removed provider {provider}")
        except Exception as ex:
            errors.append(ex)

    if errors:
        raise ExceptionGroup("Exceptions occurred when reloading providers", errors)

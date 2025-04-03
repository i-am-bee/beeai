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
import logging
from asyncio import Task
from datetime import timedelta
from functools import partial

import httpx
import yaml
from pydantic import RootModel

from beeai_server.configuration import Configuration
from beeai_server.domain.model import ProviderLocation
from beeai_server.services.provider import ProviderService
from beeai_server.utils.periodic import periodic
from kink import inject

logger = logging.getLogger(__name__)

preinstall_background_tasks: dict[str, Task] = {}


@periodic(period=timedelta(minutes=10))
@inject
async def check_official_registry(configuration: Configuration, provider_service: ProviderService):
    registry = await configuration.agent_registry.location.resolve_version()
    managed_providers = {provider.id for provider in await provider_service.list_providers() if provider.registry}
    errors = []
    desired_providers = set()

    async with httpx.AsyncClient(
        headers={"Cache-Control": "no-cache, no-store, must-revalidate", "Pragma": "no-cache", "Expires": "0"}
    ) as client:
        resp = await client.get(str(registry.get_raw_url()))
        resp = yaml.safe_load(resp.content)["providers"]
        for provider in resp:
            try:
                provider_location = RootModel[ProviderLocation].model_validate(provider["location"]).root
                provider_source = await provider_location.resolve()
                desired_providers.add(provider_source.id)
            except ValueError as e:
                errors.append(e)

    new_providers = desired_providers - managed_providers
    old_providers = managed_providers - desired_providers
    for provider_id in new_providers:
        try:
            provider_location = RootModel[ProviderLocation].model_validate(provider_id).root
            await provider_service.register_managed_provider(location=provider_location, registry=registry)
            logger.info(f"Added provider {provider}")
        except Exception as ex:
            errors.append(ex)

    for provider_id in old_providers:
        try:
            await provider_service.delete_provider(id=provider_id, force=True)
            logger.info(f"Removed provider {provider}")
        except Exception as ex:
            errors.append(ex)

    if configuration.agent_registry.preinstall:
        managed_providers = {provider.id for provider in await provider_service.list_providers() if provider.registry}
        for provider_id in managed_providers:
            try:
                if provider_id in preinstall_background_tasks:
                    continue
                install = await provider_service.install_provider(id=provider_id)
                task = asyncio.create_task(install())
                preinstall_background_tasks[provider_id] = task
                task.add_done_callback(partial(preinstall_background_tasks.pop, provider_id))
            except Exception as ex:
                errors.append(ex)
    if errors:
        raise ExceptionGroup("Exceptions occurred when reloading providers", errors)

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
import logging
from asyncio import Task
from datetime import timedelta
from functools import partial


from beeai_server.configuration import Configuration
from beeai_server.domain.provider.model import ProviderStatus
from beeai_server.services.provider import ProviderService
from beeai_server.utils.periodic import periodic
from kink import inject

logger = logging.getLogger(__name__)

preinstall_background_tasks: dict[str, Task] = {}


@periodic(period=timedelta(minutes=10))
@inject
async def check_registry(configuration: Configuration, provider_service: ProviderService):
    if not configuration.agent_registry.enabled:
        return
    registry = configuration.agent_registry.location
    provider_locations = await registry.load()
    managed_providers = {
        provider.id: provider for provider in await provider_service.list_providers() if provider.registry
    }
    errors = []
    desired_providers = {}

    for provider_location in provider_locations:
        try:
            provider_id = await provider_location.get_source()
            desired_providers[provider_id.id] = provider_location
        except ValueError as e:
            errors.append(e)

    new_providers = desired_providers.keys() - managed_providers.keys()
    old_providers = managed_providers.keys() - desired_providers.keys()
    for provider_id in new_providers:
        provider_location = desired_providers[provider_id]
        try:
            await provider_service.register_provider(location=provider_location, registry=registry)
            logger.info(f"Added provider {provider_location}")
        except Exception as ex:
            errors.append(RuntimeError(f"[{provider_location}]: Failed to add provider: {ex}"))

    for provider_id in old_providers:
        provider = managed_providers[provider_id]
        try:
            await provider_service.delete_provider(id=provider.id, force=True)
            logger.info(f"Removed provider {provider.location}")
        except Exception as ex:
            errors.append(RuntimeError(f"[{provider.location}]: Failed to remove provider: {ex}"))

    if configuration.agent_registry.preinstall:
        managed_providers = {
            provider.id
            for provider in await provider_service.list_providers()
            if provider.registry and provider.status != ProviderStatus.not_loaded
        }
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

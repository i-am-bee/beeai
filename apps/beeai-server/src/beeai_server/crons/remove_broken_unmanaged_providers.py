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

import anyio
from beeai_server.configuration import Configuration
from beeai_server.domain.model import LoadedProviderStatus, UnmanagedProvider
from beeai_server.services.mcp_proxy.provider import LoadedProvider, ProviderContainer
from beeai_server.utils.periodic import periodic
from beeai_server.utils.utils import extract_messages
from kink import inject

logger = logging.getLogger(__name__)


@periodic(period=timedelta(seconds=5))
@inject
async def remove_broken_unmanaged_providers(configuration: Configuration, provider_container: ProviderContainer):
    unmanaged_providers: list[LoadedProvider] = [
        loaded_provider
        for loaded_provider in provider_container.loaded_providers.values()
        if isinstance(loaded_provider.provider, UnmanagedProvider)
    ]
    for provider in unmanaged_providers:
        if provider.status in {LoadedProviderStatus.ready, LoadedProvider.last_error}:
            try:
                with anyio.fail_after(delay=timedelta(seconds=30).total_seconds()):
                    async with provider.session() as session:
                        await session.send_ping()
            except Exception as ex:
                logger.error(f"Provider {provider.id} failed to respond to ping in 30 seconds: {extract_messages(ex)}")
                await provider_container.remove(provider.provider)

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

from __future__ import annotations

import json
import logging
from typing import AsyncIterator, Callable

import anyio
from fastapi import HTTPException
from kink import inject
from starlette.status import HTTP_400_BAD_REQUEST, HTTP_404_NOT_FOUND

from beeai_server.adapters.interface import IProviderRepository, IEnvVariableRepository
from beeai_server.custom_types import ID
from beeai_server.domain.model import (
    ProviderWithStatus,
    LoadedProviderStatus,
    ManagedProvider,
    UnmanagedProvider,
    BaseProvider,
    ProviderLocation,
)
from beeai_server.exceptions import ManifestLoadError
from beeai_server.services.mcp_proxy.provider import ProviderContainer
from beeai_server.utils.github import ResolvedGithubUrl
from beeai_server.utils.logs_container import LogsContainer

logger = logging.getLogger(__name__)


@inject
class ProviderService:
    def __init__(
        self,
        provider_repository: IProviderRepository,
        loaded_provider_container: ProviderContainer,
        env_repository: IEnvVariableRepository,
    ):
        self._repository = provider_repository
        self._loaded_provider_container = loaded_provider_container
        self._env_repository = env_repository

    async def register_managed_provider(
        self,
        *,
        location: ProviderLocation,
        registry: ResolvedGithubUrl | None = None,
    ):
        try:
            provider_source = await location.resolve()
            provider = await ManagedProvider.load_from_source(provider_source, registry=registry)
            await self._repository.create(provider=provider)
        except ValueError as ex:
            raise ManifestLoadError(location=location, message=str(ex), status_code=HTTP_400_BAD_REQUEST) from ex
        except Exception as ex:
            raise ManifestLoadError(location=location, message=str(ex)) from ex
        # provider is not loaded yet - returns initial values
        [provider_with_metadata] = await self._get_providers_with_metadata([provider])
        # load provider asynchronously now
        await self.sync()
        return provider_with_metadata

    async def register_unmanaged_provider(self, provider: UnmanagedProvider) -> ProviderWithStatus:
        await self._loaded_provider_container.add_unmanaged_provider(provider)
        return (await self._get_providers_with_metadata([provider]))[0]

    async def preview_provider(self, location: ProviderLocation):
        try:
            provider_source = await location.resolve()
            provider = await ManagedProvider.load_from_source(source=provider_source)
            [provider] = await self._get_providers_with_metadata([provider])
            return provider
        except ValueError as ex:
            raise ManifestLoadError(location=location, message=str(ex), status_code=HTTP_400_BAD_REQUEST) from ex
        except Exception as ex:
            raise ManifestLoadError(location=location, message=str(ex)) from ex

    async def install_provider(self, *, id: ID):
        logs_container = LogsContainer()
        provider = await self._repository.get(provider_id=id)

        async def _install():
            await provider.source.install(logs_container=logs_container)
            await self._loaded_provider_container.load_or_restart(provider)

        async def logs_iterator() -> AsyncIterator[str]:
            async with anyio.create_task_group() as task_group:

                async def cancel_on_finish(coro):
                    await coro
                    task_group.cancel_scope.cancel()

                task_group.start_soon(cancel_on_finish, _install())

                async with logs_container.stream() as stream:
                    async for message in stream:
                        yield json.dumps(message.model_dump(mode="json"))

        return logs_iterator

    async def delete_provider(self, *, id: ID):
        provider = await self._repository.get(provider_id=id)

        if provider.registry:
            await provider.source.uninstall()
            await self._loaded_provider_container.load_or_restart(provider)
        else:
            await self._repository.delete(provider_id=id)
            await provider.source.uninstall()
            await self._loaded_provider_container.remove(provider)

    async def _get_providers_with_metadata(self, providers: list[BaseProvider]) -> list[ProviderWithStatus]:
        loaded_providers = {
            provider.id: {
                "status": provider.status,
                "last_error": provider.last_error,
                "missing_configuration": [var for var in provider.missing_configuration if var.required],
            }
            for provider in self._loaded_provider_container.loaded_providers.values()
        }
        env = await self._env_repository.get_all()
        return [
            ProviderWithStatus(
                **provider.model_dump(),
                **loaded_providers.get(
                    provider.id,
                    {
                        "status": LoadedProviderStatus.initializing,
                        "missing_configuration": [
                            var for var in provider.check_env(env, raise_error=False) if var.required
                        ],
                    },
                ),
            )
            for provider in providers
        ]

    async def list_providers(self) -> list[ProviderWithStatus]:
        return await self._get_providers_with_metadata(
            (await self._repository.list()) + list(self._loaded_provider_container.unmanaged_providers.values())
        )

    async def sync(self):
        await self._repository.sync()
        self._loaded_provider_container.handle_managed_providers_change(await self._repository.list())

    async def stream_logs(self, id: ID) -> Callable[..., AsyncIterator[str]]:
        if not (provider := self._loaded_provider_container.loaded_providers.get(id, None)):
            raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Provider not found")

        async def logs_iterator() -> AsyncIterator[str]:
            async with provider.logs_container.stream() as stream:
                async for message in stream:
                    yield json.dumps(message.model_dump(mode="json"))

        return logs_iterator

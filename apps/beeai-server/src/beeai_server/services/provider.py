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

from kink import inject
from starlette.status import HTTP_400_BAD_REQUEST

from beeai_server.adapters.interface import IProviderRepository, IEnvVariableRepository
from beeai_server.domain.model import ManifestLocation, ProviderWithStatus, LoadedProviderStatus, Provider
from beeai_server.exceptions import ManifestLoadError
from beeai_server.services.mcp_proxy.provider import ProviderContainer
from beeai_server.utils.github import GithubUrl


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

    async def add_provider(
        self,
        *,
        location: ManifestLocation,
        registry: GithubUrl | None = None,
    ):
        try:
            manifest = await location.load()
            provider = Provider(manifest=manifest, registry=registry, id=location.provider_id)
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

    async def preview_provider(self, location: ManifestLocation):
        try:
            manifest = await location.load()
            [provider] = await self._get_providers_with_metadata([Provider(manifest=manifest, id=location.provider_id)])
            return provider
        except ValueError as ex:
            raise ManifestLoadError(location=location, message=str(ex), status_code=HTTP_400_BAD_REQUEST) from ex
        except Exception as ex:
            raise ManifestLoadError(location=location, message=str(ex)) from ex

    async def delete_provider(self, *, location: ManifestLocation):
        await location.resolve()
        await self._repository.delete(provider_id=str(location))
        await self.sync()

    async def _get_providers_with_metadata(self, providers: list[Provider]) -> list[ProviderWithStatus]:
        loaded_providers = {
            provider.id: {
                "status": provider.status,
                "last_error": provider.last_error,
                "missing_configuration": [var for var in provider.missing_configuration if var.required],
            }
            for provider in self._loaded_provider_container.loaded_providers
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
                            var for var in provider.manifest.check_env(env, raise_error=False) if var.required
                        ],
                    },
                ),
            )
            for provider in providers
        ]

    async def list_providers(self) -> list[ProviderWithStatus]:
        return await self._get_providers_with_metadata(await self._repository.list())

    async def sync(self):
        await self._repository.sync()
        new_providers = [provider for provider in await self._repository.list()]
        self._loaded_provider_container.handle_providers_change(new_providers)

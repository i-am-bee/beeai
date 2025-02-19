from kink import inject
from starlette.status import HTTP_400_BAD_REQUEST

from beeai_server.adapters.interface import IProviderRepository
from beeai_server.domain.model import ManifestLocation, ProviderWithStatus, LoadedProviderStatus, Provider
from beeai_server.exceptions import ManifestLoadError
from beeai_server.services.mcp_proxy.provider import ProviderContainer
from beeai_server.utils.github import GithubUrl


@inject
class ProviderService:
    def __init__(self, provider_repository: IProviderRepository, loaded_provider_container: ProviderContainer):
        self._repository = provider_repository
        self._loaded_provider_container = loaded_provider_container

    async def add_provider(
        self,
        *,
        location: ManifestLocation,
        registry: GithubUrl | None = None,
        env: dict[str, str] | None = None,
    ):
        try:
            manifest = await location.load()
            provider = Provider(manifest=manifest, registry=registry, env=env, id=location.provider_id)
            await self._repository.create(provider=provider)
        except ValueError as ex:
            raise ManifestLoadError(location=location, message=str(ex), status_code=HTTP_400_BAD_REQUEST) from ex
        except Exception as ex:
            raise ManifestLoadError(location=location, message=str(ex)) from ex
        await self.sync()

    async def delete_provider(self, *, location: ManifestLocation):
        await location.resolve()
        await self._repository.delete(provider_id=str(location))
        await self.sync()

    async def list_providers(self) -> list[ProviderWithStatus]:
        loaded_providers = {
            provider.id: {"status": provider.status, "last_error": provider.last_error}
            for provider in self._loaded_provider_container.loaded_providers
        }

        return [
            ProviderWithStatus(
                **provider.model_dump(),
                **loaded_providers.get(provider.id, {"status": LoadedProviderStatus.initializing}),
            )
            async for provider in self._repository.list()
        ]

    async def sync(self):
        new_providers = [provider async for provider in self._repository.list()]
        self._loaded_provider_container.handle_providers_change(new_providers)

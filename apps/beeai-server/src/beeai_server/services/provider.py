from kink import inject
from pydantic import ValidationError
from starlette.status import HTTP_400_BAD_REQUEST

from beeai_server.adapters.interface import IProviderRepository
from beeai_server.domain.model import ManifestLocation, Provider
from beeai_server.exceptions import ManifestLoadError


@inject
class ProviderService:
    def __init__(self, provider_repository: IProviderRepository):
        self._repository = provider_repository

    async def add_provider(self, location: ManifestLocation):
        try:
            provider = await location.load()
        except ValidationError as ex:
            raise ManifestLoadError(location=location, message=str(ex), status_code=HTTP_400_BAD_REQUEST) from ex
        except Exception as ex:
            raise ManifestLoadError(location=location, message=str(ex)) from ex
        return await self._repository.create(provider=provider)

    async def delete_provider(self, location: ManifestLocation):
        await location.resolve()
        return await self._repository.delete(provider_id=str(location))

    async def list_providers(self) -> list[Provider]:
        return [provider async for provider in self._repository.list()]

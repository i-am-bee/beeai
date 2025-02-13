from pathlib import Path
from typing import AsyncIterator

import yaml
from anyio import Path as AsyncPath
from pydantic import BaseModel

from beeai_server.adapters.interface import IProviderRepository
from beeai_server.domain.model import ProviderManifest, Provider


class ProviderConfigFile(BaseModel):
    providers: dict[str, ProviderManifest]


class FilesystemProviderRepository(IProviderRepository):
    def __init__(self, provider_config_path: Path):
        self._config_path = AsyncPath(provider_config_path)

    async def _write_config(self, providers: dict[str, ProviderManifest]) -> None:
        # Ensure that path exists
        await self._config_path.parent.mkdir(parents=True, exist_ok=True)
        config = yaml.dump(ProviderConfigFile(providers=providers).model_dump(mode="json"), indent=2)
        await self._config_path.write_text(config)

    async def _read_config(self) -> dict[str, ProviderManifest]:
        if not await self._config_path.exists():
            return {}

        config = await self._config_path.read_text()
        return ProviderConfigFile.model_validate(yaml.safe_load(config)).providers

    async def list(self) -> AsyncIterator[Provider]:
        for provider_id, provider in (await self._read_config()).items():
            yield Provider(id=provider_id, manifest=provider)

    async def create(self, *, provider: Provider) -> None:
        providers = await self._read_config()
        if provider.id in providers:
            raise ValueError(f"Provider with ID {provider.id} already exists")
        providers[provider.id] = provider.manifest
        await self._write_config(providers)

    async def delete(self, *, provider_id: str) -> None:
        repository_providers = await self._read_config()
        if repository_providers.pop(provider_id, None):
            await self._write_config(repository_providers)
            return
        raise ValueError(f"Provider with ID {provider_id} not found")

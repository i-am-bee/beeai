import asyncio
from pathlib import Path
from typing import AsyncIterator

import yaml
from anyio import open_file, Path as AsyncPath
from pydantic import BaseModel

from beeai_api.adapters.interface import IRegistryRepository
from beeai_api.domain.model import Registry


class RegistryConfigFile(BaseModel):
    registries: list[Registry]


class FilesystemRegistryRepository(IRegistryRepository):
    def __init__(self, registry_path: Path):
        self._registry_path = AsyncPath(registry_path)
        self._lock = asyncio.Lock()

    async def _write_registries(self, registries: list[Registry]):
        async with self._lock:
            # Ensure that path exists
            await self._registry_path.parent.mkdir(parents=True, exist_ok=True)
            async with open_file(self._registry_path, mode="w") as f:
                await f.write(RegistryConfigFile(registries=registries).model_dump())

    async def _read_registries(self) -> list[Registry]:
        async with self._lock:
            if not await self._registry_path.exists():
                return []

            async with open_file(self._registry_path, mode="r") as f:
                return RegistryConfigFile.model_validate(yaml.safe_load(await f.read())).registries

    async def list(self) -> AsyncIterator[Registry]:
        for registry in await self._read_registries():
            yield registry

    async def create(self, *, registry: Registry) -> None:
        registries = [registry async for registry in self.list()]
        if registry not in registries:
            registries.append(registry)
            await self._write_registries(registries)

    async def delete(self, *, registry: Registry) -> None:
        registries = [registry async for registry in self.list() if registry != registry]
        await self._write_registries(registries)

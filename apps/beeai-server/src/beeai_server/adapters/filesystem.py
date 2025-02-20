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
from pathlib import Path
from typing import AsyncIterator
from uuid import uuid4

import yaml
from anyio import Path as AsyncPath
from pydantic import BaseModel, ValidationError

from beeai_server.adapters.interface import IProviderRepository
from beeai_server.domain.model import Provider


class ProviderConfigFile(BaseModel):
    providers: list[Provider]


class FilesystemProviderRepository(IProviderRepository):
    def __init__(self, provider_config_path: Path):
        self._config_path = AsyncPath(provider_config_path)

    async def _write_config(self, providers: list[Provider]) -> None:
        # Ensure that path exists
        await self._config_path.parent.mkdir(parents=True, exist_ok=True)
        config = yaml.dump(ProviderConfigFile(providers=providers).model_dump(mode="json"), indent=2)
        await self._config_path.write_text(config)

    async def _read_config(self) -> list[Provider]:
        if not await self._config_path.exists():
            return []

        config = await self._config_path.read_text()
        try:
            return ProviderConfigFile.model_validate(yaml.safe_load(config)).providers
        except ValidationError as ex:
            backup = self._config_path.parent / f"{self._config_path.name}.bak.{uuid4().hex[:6]}"
            logging.error(f"Invalid config file, renaming to {backup}. {ex!r}")
            await self._config_path.rename(backup)
            return []

    async def list(self) -> AsyncIterator[Provider]:
        for provider in await self._read_config():
            yield provider

    async def create(self, *, provider: Provider) -> None:
        repository_providers = await self._read_config()
        if provider.id in {p.id for p in repository_providers}:
            raise ValueError(f"Provider with ID {provider.id} already exists")
        repository_providers.append(provider)
        await self._write_config(repository_providers)

    async def delete(self, *, provider_id: str) -> None:
        repository_providers = await self._read_config()
        new_providers = [p for p in repository_providers if p.id != provider_id]
        if len(new_providers) < len(repository_providers):
            await self._write_config(new_providers)
            return
        raise ValueError(f"Provider with ID {provider_id} not found")

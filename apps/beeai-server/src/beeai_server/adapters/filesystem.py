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
from uuid import uuid4

import yaml
from anyio import Path as AsyncPath
from pydantic import BaseModel, ValidationError, RootModel

from beeai_server.adapters.interface import (
    IProviderRepository,
    IEnvVariableRepository,
    ITelemetryRepository,
    TelemetryConfig,
    NOT_SET,
)
from beeai_server.domain.model import Provider
from beeai_server.utils.utils import filter_dict


class ProviderConfigFile(BaseModel):
    providers: list[Provider]


class FilesystemProviderRepository(IProviderRepository):
    def __init__(self, provider_config_path: Path):
        self._config_path = AsyncPath(provider_config_path)
        self._repository_providers: list[Provider] | None = None

    async def _write_config(self, providers: list[Provider]) -> None:
        # Ensure that path exists
        await self._config_path.parent.mkdir(parents=True, exist_ok=True)
        config = yaml.dump(ProviderConfigFile(providers=providers).model_dump(mode="json"), indent=2)
        # We do not handle conflicts - if the file was updated in the meantime, we override it with new values
        await self._config_path.write_text(config)
        self._repository_providers = providers

    async def sync(self) -> None:
        if not await self._config_path.exists():
            self._repository_providers = []
            return

        config = await self._config_path.read_text()
        try:
            self._repository_providers = ProviderConfigFile.model_validate(yaml.safe_load(config)).providers
        except ValidationError as ex:
            backup = self._config_path.parent / f"{self._config_path.name}.bak.{uuid4().hex[:6]}"
            logging.error(f"Invalid config file, renaming to {backup}. {ex!r}")
            await self._config_path.rename(backup)
            self._repository_providers = []

    async def list(self) -> list[Provider]:
        if self._repository_providers is None:
            await self.sync()
        return self._repository_providers

    async def create(self, *, provider: Provider) -> None:
        repository_providers = await self.list()
        if provider.id in {p.id for p in repository_providers}:
            raise ValueError(f"Provider with ID {provider.id} already exists")
        repository_providers.append(provider)
        await self._write_config(repository_providers)

    async def delete(self, *, provider_id: str) -> None:
        repository_providers = await self.list()
        new_providers = [p for p in repository_providers if p.id != provider_id]
        if len(new_providers) < len(repository_providers):
            await self._write_config(new_providers)
            return
        raise ValueError(f"Provider with ID {provider_id} not found")


EnvConfigFile = RootModel[dict[str, str]]


class FilesystemEnvVariableRepository(IEnvVariableRepository):
    def __init__(self, env_variable_path: Path):
        self._env_file_path = AsyncPath(env_variable_path)
        self._env: dict[str, str] | None = None

    async def sync(self):
        if not await self._env_file_path.exists():
            self._env = {}
            return
        config = await self._env_file_path.read_text()
        try:
            self._env = EnvConfigFile.model_validate(yaml.safe_load(config)).root
        except ValidationError as ex:
            backup = self._env_file_path.parent / f"{self._env_file_path.name}.bak.{uuid4().hex[:6]}"
            logging.error(f"Invalid config file, renaming to {backup}. {ex!r}")
            await self._env_file_path.rename(backup)
            self._env = {}

    async def get_all(self) -> dict[str, str]:
        if self._env is None:
            await self.sync()
        return self._env

    async def _write_config(self, env: dict[str, str]) -> None:
        # Ensure that path exists
        await self._env_file_path.parent.mkdir(parents=True, exist_ok=True)
        # We do not handle conflicts - if the file was updated in the meantime, we override it with new values
        config = yaml.dump(EnvConfigFile(env).model_dump(mode="json"), indent=2)
        await self._env_file_path.write_text(config)
        self._env = env

    async def get(self, key: str, default: str | None = NOT_SET) -> str:
        env = await self.get_all()
        return env.get(key) if default is NOT_SET else env.get(key, default)

    async def update(self, update: dict[str, str | None]) -> None:
        env = filter_dict({**await self.get_all(), **update})
        await self._write_config(env)


class FilesystemTelemetryRepository(ITelemetryRepository):
    def __init__(self, telemetry_config_path: Path):
        self._config_path = AsyncPath(telemetry_config_path)
        self._config: TelemetryConfig | None = None

    async def _write_config(self) -> None:
        # Ensure that path exists
        await self._config_path.parent.mkdir(parents=True, exist_ok=True)
        config = yaml.dump(self._config.model_dump(mode="json"), indent=2)
        # We do not handle conflicts - if the file was updated in the meantime, we override it with new values
        await self._config_path.write_text(config)

    async def sync(self) -> None:
        if not await self._config_path.exists():
            if not self._config:
                self._config = TelemetryConfig()
            return

        config = await self._config_path.read_text()
        try:
            self._config = TelemetryConfig.model_validate(yaml.safe_load(config))
        except ValidationError as ex:
            backup = self._config_path.parent / f"{self._config_path.name}.bak.{uuid4().hex[:6]}"
            logging.error(f"Invalid collector config file, renaming to {backup}. {ex!r}")
            await self._config_path.rename(backup)

    async def set(self, *, config: TelemetryConfig) -> None:
        self._config = config
        await self._write_config()

    async def get(self) -> TelemetryConfig:
        if not self._config:
            await self.sync()
        return self._config

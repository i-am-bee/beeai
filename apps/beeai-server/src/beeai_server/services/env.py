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

from typing import Coroutine, Callable

from kink import inject

from beeai_server.adapters.interface import IEnvVariableRepository
from beeai_server.domain.provider.container import ProviderContainer


@inject
class EnvService:
    def __init__(self, env_repository: IEnvVariableRepository, loaded_provider_container: ProviderContainer):
        self._repository = env_repository
        self._loaded_provider_container = loaded_provider_container

    async def update_env(self, *, env: dict[str, str | None]) -> Callable[..., Coroutine[None, None, None]]:
        await self._repository.update(env)
        return self._loaded_provider_container.handle_reload_on_env_update

    async def list_env(self) -> dict[str, str]:
        return await self._repository.get_all()

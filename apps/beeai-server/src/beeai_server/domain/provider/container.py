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

import asyncio
import functools
import logging
import math
from asyncio import TimerHandle, create_task
from collections import ChainMap
from contextlib import asynccontextmanager
from datetime import timedelta
from typing import AsyncIterator, Callable, Final, TypeVar, Mapping, Self

import httpx
from cachetools import TTLCache
from httpx import Response

from beeai_server.adapters.interface import IEnvVariableRepository
from beeai_server.domain.provider.model import BaseProvider, EnvVar, Agent, ProviderStatus, ProviderErrorMessage
from beeai_server.exceptions import ProviderNotInstalledError
from beeai_server.utils.logs_container import LogsContainer
from beeai_server.utils.utils import cancel_task, extract_messages
from pydantic import BaseModel
from structlog.contextvars import bind_contextvars, unbind_contextvars

logger = logging.getLogger(__name__)

BaseModelT = TypeVar("BaseModelT", bound=BaseModel)


def bind_logging_context(method: Callable) -> Callable:
    @functools.wraps(method)
    async def _fn(self: "LoadedProvider", *args, **kwargs):
        bind_contextvars(provider=self.provider.location)
        try:
            return await method(self, *args, **kwargs)
        finally:
            unbind_contextvars("provider")

    return _fn


class LoadedProvider:
    INITIALIZE_TIMEOUT = timedelta(seconds=30)
    status: ProviderStatus = ProviderStatus.not_installed
    last_error: ProviderErrorMessage | None = None
    provider: BaseProvider
    id: str
    missing_configuration: list[EnvVar] = []
    runs: Mapping[str, Self]

    def __init__(self, provider: BaseProvider, env: dict[str, str], autostart=True) -> None:
        self.provider = provider
        self.env = env
        self.id = provider.id
        self.logs_container = LogsContainer()
        self.requests = {}
        self._start_task = None
        self.runs = TTLCache(maxsize=math.inf, ttl=timedelta(minutes=30).total_seconds())
        self._autostart = autostart
        self._base_url: str | None = None
        self._auto_stop_timeout: TimerHandle | None = None
        self.agents = [
            Agent.model_validate(
                {
                    "name": agent.name,
                    "description": agent.description,
                    "metadata": {**agent.metadata.model_dump(), "provider": self.id},
                }
            )
            for agent in self.provider.manifest.agents
        ]

    # @bind_logging_context
    async def handle_reload_env(self, env: dict[str, str]) -> None:
        self.env = env
        if self.status in {ProviderStatus.running, ProviderStatus.starting, ProviderStatus.error}:
            await self.stop()
        if self._autostart:
            await self.start()

    @asynccontextmanager
    async def client(self) -> AsyncIterator[httpx.AsyncClient]:
        bind_contextvars(provider=self.id)
        if self.status in {
            ProviderStatus.not_installed,
            ProviderStatus.install_error,
        }:
            if self.status == ProviderStatus.not_installed:
                message = "Agent is not installed, use 'beeai install <name>' to install"
            else:
                message = f"Cannot install agent (retry using 'beeai install <name>'): {self.last_error.message}"
            raise ProviderNotInstalledError(message)

        async def _on_response(response: Response):
            if "Run-ID" in response.headers:
                self.runs[response.headers["Run-ID"]] = self
            return response

        if self.status not in {ProviderStatus.running, ProviderStatus.starting}:
            await self.start()
        try:
            async with httpx.AsyncClient(base_url=self._base_url, timeout=5) as client:
                await client.get("agents")
        except BaseException as ex:
            message = f"Restoring broken session for provider {self.id}: {extract_messages(ex)}"
            logger.warning(message)
            self.status = ProviderStatus.error
            self.last_error = ProviderErrorMessage(message=message)
            await self.start()
        try:
            async with httpx.AsyncClient(
                base_url=self._base_url, event_hooks={"response": [_on_response]}, timeout=None
            ) as client:
                yield client
        finally:
            if not self._autostart:
                if self._auto_stop_timeout:
                    self._auto_stop_timeout.cancel()

                # stop after timeout
                if self.provider.auto_stop_timeout and not self._autostart:

                    async def stop_callback():
                        await asyncio.sleep(self.provider.auto_stop_timeout.total_seconds())
                        logger.info("Stopping provider after timeout")
                        await self.stop()

                    self._auto_stop_timeout = asyncio.create_task(stop_callback())
                    self._auto_stop_timeout.add_done_callback(lambda task: task.cancel())
            unbind_contextvars("provider")

    def _with_id(self, objects: list[BaseModelT]) -> list[BaseModelT]:
        for obj in objects:
            obj.provider = self.id
        return objects

    @bind_logging_context
    async def install(self, logs_container: LogsContainer | None = None) -> None:
        if self.status not in {ProviderStatus.not_installed, ProviderStatus.install_error}:
            return
        try:
            self.status = ProviderStatus.installing
            logger.info(f"Installing provider {self.id}")
            self.logs_container.clear()
            await self.provider.install(logs_container=logs_container or self.logs_container)
            self.logs_container.clear()
            self.status = ProviderStatus.ready
        except Exception as ex:
            self.last_error = ProviderErrorMessage(message=str(extract_messages(ex)))
            self.status = ProviderStatus.install_error

    @bind_logging_context
    async def uninstall(self):
        await self.stop()
        await self.provider.uninstall()
        self.status = ProviderStatus.not_installed

    @bind_logging_context
    async def start(self):
        if self.status == ProviderStatus.starting:
            logger.warning("Provider is already starting")
            await self._start_task
            return

        if self.status not in {ProviderStatus.ready, ProviderStatus.error}:
            logger.warning(f"Attempting to start provider that is not in a ready state: {self.status}")
            return
        if not await self.provider.is_installed():
            logger.warning("Provider was uninstalled externally. Resetting state to 'not_installed'")
            self.status = ProviderStatus.not_installed
            return
        await self.stop()
        try:
            self.status = ProviderStatus.starting
            self.missing_configuration = self.provider.check_env(env=self.env)
            self._start_task = asyncio.create_task(
                self.provider.start(env=self.env, logs_container=self.logs_container)
            )
            self._base_url = await self._start_task
            self.status = ProviderStatus.running
        except BaseException as ex:
            self.last_error = ProviderErrorMessage(message=f"Error connecting to provider: {extract_messages(ex)}")
            self.status = ProviderStatus.error

    @bind_logging_context
    async def stop(self):
        try:
            if self._start_task:
                if self.status == ProviderStatus.starting:
                    await cancel_task(self._start_task)
                else:
                    await self._start_task
            await self.provider.stop()
        except BaseException as ex:
            logger.warning(f"Exception occurred when stopping session: {ex!r}")

        if self.status == self.status.running:
            self.status = ProviderStatus.ready

        self._start_task = None

    @bind_logging_context
    async def initialize(self):
        if self.status == ProviderStatus.not_installed and await self.provider.is_installed():
            self.status = ProviderStatus.ready
            if self._autostart:
                create_task(self.start()).add_done_callback(lambda task: task.exception())  # start in the background

    @bind_logging_context
    async def close(self):
        await self.stop()

    @bind_logging_context
    async def __aenter__(self):
        await self.initialize()

    @bind_logging_context
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()


class ProviderContainer:
    """
    Manage group of LoadedProvider instances:
      - react to changes in provider repository - add or remove providers as necessary
    """

    RELOAD_PERIOD: Final = timedelta(minutes=1)

    def __init__(
        self,
        env_repository: IEnvVariableRepository,
        autostart_providers: bool = True,
    ):
        self.loaded_providers: dict[str, LoadedProvider] = {}
        self._env_repository = env_repository
        self._env: dict[str, str] | None = None
        self._autostart = autostart_providers

    def get_provider_by_agent(self, agent_name: str) -> LoadedProvider:
        providers = [
            loaded_provider
            for loaded_provider in self.loaded_providers.values()
            if agent_name in {a.name for a in loaded_provider.agents}
        ]
        if not providers:
            raise ValueError(f"Agent {agent_name} not found")
        return providers[0]

    def get_provider_by_run(self, run_id: str) -> LoadedProvider:
        provider = ChainMap(*(provider.runs for provider in self.loaded_providers.values())).get(run_id, None)
        if provider:
            return provider
        raise ValueError(f"Run {run_id} not found")

    async def add(self, provider: BaseProvider):
        env = await self._env_repository.get_all()
        self.loaded_providers[provider.id] = LoadedProvider(
            provider,
            env=provider.extract_env(env),
            autostart=self._autostart,
        )
        await self.loaded_providers[provider.id].initialize()

    async def remove(self, provider: BaseProvider):
        provider = self.loaded_providers.pop(provider.id)
        await provider.close()

    async def add_or_replace(self, provider: BaseProvider):
        if provider.id in self.loaded_providers:
            await self.remove(provider)
        await self.add(provider)

    async def handle_reload_on_env_update(self):
        self._env = await self._env_repository.get_all()
        await asyncio.gather(
            *(
                loaded_provider.handle_reload_env(env=loaded_provider.provider.extract_env(self._env))
                for loaded_provider in self.loaded_providers.values()
            )
        )

    async def __aenter__(self):
        for provider in self.loaded_providers.values():
            await provider.initialize()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        try:
            await asyncio.gather(*(provider.stop() for provider in self.loaded_providers.values()))
            self.loaded_providers = {}
        except Exception as ex:
            logger.critical(f"Exception occurred during provider container cleanup: {ex}")

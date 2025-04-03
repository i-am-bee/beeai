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

import asyncio
import functools
import logging
from asyncio import TimerHandle
from contextlib import AsyncExitStack, asynccontextmanager
from datetime import timedelta
from typing import Callable, Final, TypeVar, AsyncIterator

import anyio
from anyio import create_task_group

from acp import ClientSession, InitializeResult, Resource, ServerSession, Tool
from acp.shared.context import RequestContext
from acp.shared.session import ReceiveNotificationT, ReceiveRequestT, RequestResponder, SendResultT
from acp.types import Agent, AgentTemplate, Prompt
from anyio.abc import TaskGroup
from anyio.streams.memory import MemoryObjectReceiveStream
from beeai_sdk.schemas.base import Input, Output
from beeai_server.adapters.interface import IEnvVariableRepository
from beeai_server.domain.model import (
    BaseProvider,
    EnvVar,
    LoadedProviderStatus,
    LoadProviderErrorMessage,
    ManagedProvider,
)
from beeai_server.services.mcp_proxy.constants import NotificationStreamType
from beeai_server.services.mcp_proxy.notification_hub import NotificationHub
from beeai_server.utils.logs_container import LogsContainer
from beeai_server.utils.utils import extract_messages, cancel_task
from pydantic import BaseModel
from structlog.contextvars import bind_contextvars, unbind_contextvars

logger = logging.getLogger(__name__)

BaseModelT = TypeVar("BaseModelT", bound=BaseModel)


def bind_logging_context(method: Callable) -> Callable:
    @functools.wraps(method)
    def _fn(self: "LoadedProvider", *args, **kwargs):
        bind_contextvars(provider=self.id)
        try:
            return method(self, *args, **kwargs)
        finally:
            unbind_contextvars("provider")

    return _fn


class LoadedProvider:
    """
    Manage a single provider connection:
      - load features (tools, agents, ...) offered by the provider
      - reload features on notifications (ToolListChangedNotification, ...)
      - reconnect on issues
      - provider uninterrupted stream of messages:
            use `provider.incoming_messages` instead of `provider.session.incoming messages` as the session may break
    """

    INITIALIZE_TIMEOUT = timedelta(seconds=30)
    incoming_messages: MemoryObjectReceiveStream[
        RequestResponder[ReceiveRequestT, SendResultT] | ReceiveNotificationT | Exception
    ]
    status: LoadedProviderStatus = LoadedProviderStatus.not_installed
    last_error: LoadProviderErrorMessage | None = None
    provider: BaseProvider
    id: str
    agent_templates: list[AgentTemplate] = []
    tools: list[Tool] = []
    resources: list[Resource] = []
    prompts: list[Prompt] = []
    missing_configuration: list[EnvVar] = []

    def __init__(
        self, provider: BaseProvider, env: dict[str, str], notification_hub: NotificationHub, autostart=True
    ) -> None:
        self.provider = provider
        self.notification_hub = notification_hub
        self.env = env
        self.id = provider.id
        self._agents = self._with_id(
            [
                Agent.model_validate(
                    {
                        "inputSchema": Input.model_json_schema(),
                        "outputSchema": Output.model_json_schema(),
                        **provider.manifest.model_dump(),
                    }
                )
            ]
        )
        self.logs_container = LogsContainer()
        self._session: ClientSession | None = None
        self._start_task = None
        self._session_exit_stack = AsyncExitStack()
        self._writer_exit_stack = AsyncExitStack()
        self._write_messages, self.incoming_messages = anyio.create_memory_object_stream()
        self._autostart = autostart
        self._auto_stop_timeout: TimerHandle | None = None

    async def handle_reload_env(self, env: dict[str, str]) -> None:
        self.env = env
        if self.status in {LoadedProviderStatus.running, LoadedProviderStatus.starting, LoadedProviderStatus.error}:
            await self.stop()
        if self._autostart:
            await self.start()

    @asynccontextmanager
    @bind_logging_context
    async def session(self) -> AsyncIterator[ClientSession]:
        if self.status not in {
            LoadedProviderStatus.not_installed,
            LoadedProviderStatus.install_error,
            LoadedProviderStatus.running,
        }:
            await self.start()
        try:
            with anyio.fail_after(timedelta(seconds=5).total_seconds()):
                await self._session.send_ping()
        except BaseException as ex:
            message = f"Restoring broken session for provider {self.id}: {extract_messages(ex)}"
            logger.warning(message)
            self.status = LoadedProviderStatus.error
            self.last_error = LoadProviderErrorMessage(message=message)
            await self.start()
        try:
            yield self._session
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

    def _with_id(self, objects: list[BaseModelT]) -> list[BaseModelT]:
        for obj in objects:
            obj.provider = self.id
        return objects

    @property
    def agents(self):
        return [
            Agent.model_validate({**self.provider.manifest.model_dump(), **agent.model_dump(), "provider": self.id})
            for agent in self._agents
        ]

    async def _load_features(self, session: ClientSession, initialize_result: InitializeResult):
        logger.info(f"Loading features for provider {self.provider.id}.")
        if initialize_result.capabilities.agents and initialize_result.capabilities.agents.templates:
            self.agent_templates = self._with_id((await session.list_agent_templates()).agentTemplates)
        if initialize_result.capabilities.agents:
            self._agents = (await session.list_agents()).agents
        if initialize_result.capabilities.tools:
            self.tools = self._with_id((await session.list_tools()).tools)
        if initialize_result.capabilities.resources:
            self.resources = self._with_id((await session.list_resources()).resources)
        if initialize_result.capabilities.prompts:
            self.prompts = self._with_id((await session.list_prompts()).prompts)
        logger.info(
            f"Loaded features - "
            f"Agents: {len(self.agents)}, "
            f"Agent Templates: {len(self.agent_templates)}, "
            f"Tools: {len(self.tools)}, "
            f"Resources: {len(self.resources)}, "
            f"Prompts: {len(self.prompts)}"
        )

    @asynccontextmanager
    async def _initialize_session(self):
        # Just do not propagate the cancellation to the parent task please???
        async with create_task_group():
            async with self.provider.mcp_client(env=self.env, logs_container=self.logs_container) as streams:
                async with ClientSession(*streams) as session:
                    with anyio.fail_after(self.INITIALIZE_TIMEOUT.total_seconds()):
                        initialize_result = await session.initialize()
                        await self._load_features(session, initialize_result)

                        async def _stream_notifications():
                            async for message in session.incoming_messages:
                                await self._write_messages.send(message)

                        try:
                            stream_task = asyncio.create_task(_stream_notifications())
                            yield session
                        finally:
                            await cancel_task(stream_task)

    @bind_logging_context
    async def install(self, logs_container: LogsContainer | None = None) -> None:
        if self.status not in {LoadedProviderStatus.not_installed, LoadedProviderStatus.install_error}:
            return
        try:
            self.status = LoadedProviderStatus.installing
            logger.info(f"Installing provider {self.id}")
            self.logs_container.clear()
            await self.provider.install(logs_container=logs_container or self.logs_container)
            self.logs_container.clear()
            self.status = LoadedProviderStatus.ready
        except Exception as ex:
            self.last_error = LoadProviderErrorMessage(message=str(extract_messages(ex)))
            self.status = LoadedProviderStatus.install_error

    async def uninstall(self):
        await self.stop()
        await self.provider.uninstall()
        self.status = LoadedProviderStatus.not_installed

    @bind_logging_context
    async def start(self):
        if self.status not in {LoadedProviderStatus.ready, LoadedProviderStatus.error}:
            logger.warning(f"Attempting to start provider that is not in a ready state: {self.status}")
            return
        if not await self.provider.is_installed():
            logger.warning("Provider was uninstalled externally. Resetting state to 'not_installed'")
            self.status = LoadedProviderStatus.not_installed
            return
        await self.stop()
        self.status = LoadedProviderStatus.starting
        try:
            self.missing_configuration = self.provider.check_env(env=self.env)
            initialize_coroutine = self._session_exit_stack.enter_async_context(self._initialize_session())
            self._start_task = asyncio.create_task(initialize_coroutine)
            self._session = await self._start_task
            await self.notification_hub.register(self)
            self.status = LoadedProviderStatus.running
        except BaseException as ex:
            self.last_error = LoadProviderErrorMessage(message=f"Error connecting to provider: {extract_messages(ex)}")
            self.status = LoadedProviderStatus.error

    @bind_logging_context
    async def stop(self):
        try:
            await self.notification_hub.remove(self)
            if self.status == LoadedProviderStatus.starting:
                await cancel_task(self._start_task)
            await self._session_exit_stack.aclose()
        except Exception as ex:
            logger.warning(f"Exception occurred when stopping session: {ex!r}")
            self._session_exit_stack.pop_all()

        if self.status == self.status.running:
            self.status = LoadedProviderStatus.ready

    async def initialize(self):
        await self._writer_exit_stack.enter_async_context(self._write_messages)
        if self.status == LoadedProviderStatus.not_installed and await self.provider.is_installed():
            self.status = LoadedProviderStatus.ready
            if self._autostart:
                await self.start()

    async def close(self):
        await self._writer_exit_stack.aclose()
        await self.stop()

    async def __aenter__(self):
        await self.initialize()

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()


class ProviderContainer:
    """
    Manage group of LoadedProvider instances:
      - react to changes in provider repository - add or remove providers as necessary
      - aggregate notifications from all providers using NotificationHub
    """

    RELOAD_PERIOD: Final = timedelta(minutes=1)

    def __init__(
        self,
        env_repository: IEnvVariableRepository,
        autostart_providers: bool = True,
    ):
        self._managed_providers: dict[str, ManagedProvider] = {}
        self._env_repository = env_repository
        self.loaded_providers: dict[str, LoadedProvider] = {}
        self._notification_hub = NotificationHub()
        self._provider_change_task_group: TaskGroup | None = None
        self._env: dict[str, str] | None = None
        self._exit_stack = AsyncExitStack()
        self._autostart = autostart_providers

    @property
    def tools(self) -> list[Tool]:
        return [tool for p in self.loaded_providers.values() for tool in p.tools]

    @property
    def agent_templates(self) -> list[AgentTemplate]:
        return [template for p in self.loaded_providers.values() for template in p.agent_templates]

    @property
    def agents(self) -> list[Agent]:
        return [agent for p in self.loaded_providers.values() for agent in p.agents]

    @property
    def resources(self) -> list[Resource]:
        return [resource for p in self.loaded_providers.values() for resource in p.resources]

    @property
    def prompts(self) -> list[Prompt]:
        return [prompt for p in self.loaded_providers.values() for prompt in p.prompts]

    @property
    def routing_table(self) -> dict[str, LoadedProvider]:
        return {
            **{f"tool/{tool.name}": p for p in self.loaded_providers.values() for tool in p.tools},
            **{f"prompt/{prompt.name}": p for p in self.loaded_providers.values() for prompt in p.prompts},
            **{f"resource/{resource.uri}": p for p in self.loaded_providers.values() for resource in p.resources},
            **{f"agent/{agent.name}": p for p in self.loaded_providers.values() for agent in p.agents},
            **{
                f"agent_template/{templ.name}": p for p in self.loaded_providers.values() for templ in p.agent_templates
            },
        }

    def get_provider(self, object_id: str):
        try:
            return self.routing_table[object_id]
        except KeyError:
            raise ValueError(f"{object_id} not found in any provider")

    def forward_notifications(
        self,
        session: ServerSession,
        streams=NotificationStreamType.BROADCAST,
        request_context: RequestContext | None = None,
    ):
        return self._notification_hub.forward_notifications(
            session=session, streams=streams, request_context=request_context
        )

    async def add(self, provider: BaseProvider):
        env = await self._env_repository.get_all()
        self.loaded_providers[provider.id] = LoadedProvider(
            provider,
            env=provider.extract_env(env),
            notification_hub=self._notification_hub,
            autostart=self._autostart,
        )
        await self.loaded_providers[provider.id].initialize()

    async def remove(self, provider: BaseProvider):
        provider = self.loaded_providers.pop(provider.id)
        await provider.close()

    async def handle_reload_on_env_update(self):
        self._env = await self._env_repository.get_all()
        await asyncio.gather(
            *(
                loaded_provider.handle_reload_env(env=loaded_provider.provider.extract_env(self._env))
                for loaded_provider in self.loaded_providers.values()
            )
        )

    async def __aenter__(self):
        await self._exit_stack.enter_async_context(self._notification_hub)

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        try:
            await asyncio.gather(*(provider.stop() for provider in self.loaded_providers.values()))
            self.loaded_providers = {}
            await self._exit_stack.aclose()
        except Exception as ex:
            logger.critical(f"Exception occurred during provider container cleanup: {ex}")

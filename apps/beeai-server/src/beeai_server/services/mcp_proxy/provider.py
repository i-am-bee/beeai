import asyncio
import logging
from contextlib import AsyncExitStack
from datetime import timedelta
from enum import StrEnum
from typing import Self, Literal, Final

import anyio
from anyio.abc import TaskGroup
from anyio.streams.memory import MemoryObjectReceiveStream
from kink import inject

from beeai_server.adapters.interface import IProviderRepository
from beeai_server.domain.model import Provider, LoadedProviderStatus
from beeai_server.services.mcp_proxy.constants import NotificationStreamType
from beeai_server.services.mcp_proxy.notification_hub import NotificationHub
from beeai_server.utils.periodic import Periodic
from mcp import ClientSession, Tool, Resource, InitializeResult, types, ServerSession
from mcp.shared.context import RequestContext
from mcp.shared.session import RequestResponder, ReceiveRequestT, SendResultT, ReceiveNotificationT
from mcp.types import AgentTemplate, Prompt, Agent

logger = logging.getLogger(__name__)


class LoadedProvider:
    """
    Manage a single provider connection:
      - load features (tools, agents, ...) offered by the provider
      - reload features on notifications (ToolListChangedNotification, ...)
      - reconnect on issues
      - provider uninterrupted stream of messages:
            use `provider.incoming_messages` instead of `provider.session.incoming messages` as the session may break
    """

    RECONNECT_INTERVAL = timedelta(seconds=10)
    PING_TIMEOUT = timedelta(seconds=5)
    INITIALIZE_TIMEOUT = timedelta(seconds=30)
    session: ClientSession | None = None
    incoming_messages: MemoryObjectReceiveStream[
        RequestResponder[ReceiveRequestT, SendResultT] | ReceiveNotificationT | Exception
    ]
    status: LoadedProviderStatus = LoadedProviderStatus.initializing
    last_error: str | None = None
    provider: Provider
    id: str
    agent_templates: list[AgentTemplate] = []
    agents: list[Agent] = []
    tools: list[Tool] = []
    resources: list[Resource] = []
    prompts: list[Prompt] = []

    def __init__(self, provider: Provider):
        self.provider = provider
        self.id = provider.id
        self._open = False
        self._ensure_session_periodic = Periodic(
            executor=self._ensure_session,
            period=self.RECONNECT_INTERVAL,
            name=f"Ensure session for provider: {provider.id}",
        )
        self._session_exit_stack = AsyncExitStack()
        self._writers_exit_stack = AsyncExitStack()
        self._write_messages, self.incoming_messages = anyio.create_memory_object_stream()
        self._stopping = False
        self._stopped = asyncio.Event()
        self._supports_agents = True
        self._initialize_result: InitializeResult | None = None

    async def init(self):
        return await self.__aenter__()

    async def close(self):
        return await self.__aexit__(None, None, None)

    class _LoadFeature(StrEnum):
        agent_templates = "agent_templates"
        agents = "agents"
        tools = "tools"
        resources = "resources"
        prompts = "prompts"

        @classmethod
        def all(cls) -> list[Self]:
            return [member.value for member in cls]

    async def _load_features(self, features: set[_LoadFeature] | Literal["all"] = "all"):
        """
        TODO: Use low lever requests - pagination not implemented in mcp client?
        """
        features = self._LoadFeature.all() if features == "all" else features
        logger.info(f"Loading features for provider {self.provider.id}: {list(features)}.")
        try:
            with anyio.fail_after(self.INITIALIZE_TIMEOUT.total_seconds()):
                if (
                    self._initialize_result.capabilities.agents
                    and self._initialize_result.capabilities.agents.templates
                    and self._LoadFeature.agent_templates in features
                ):
                    self.agent_templates = (await self.session.list_agent_templates()).agentTemplates
                    logger.info(f"Loaded {len(self.agent_templates)} agent templates")
                if self._initialize_result.capabilities.agents and self._LoadFeature.agents in features:
                    self.agents = (await self.session.list_agents()).agents
                    logger.info(f"Loaded {len(self.agents)} agents")
                if self._initialize_result.capabilities.tools and self._LoadFeature.tools in features:
                    self.tools = (await self.session.list_tools()).tools
                    logger.info(f"Loaded {len(self.tools)} tools")
                if self._initialize_result.capabilities.resources and self._LoadFeature.resources in features:
                    self.resources = (await self.session.list_resources()).resources
                    logger.info(f"Loaded {len(self.resources)} resources")
                if self._initialize_result.capabilities.prompts and self._LoadFeature.prompts in features:
                    self.prompts = (await self.session.list_prompts()).prompts
                    logger.info(f"Loaded {len(self.prompts)} prompts")
        except Exception as ex:
            msg = f"Failed to load features for provider: {self.id}: {ex!r}"
            logger.error(msg)
            self.session = None  # Mark session as broken - reinitialize connection in next period
            self.last_error = msg
            self.status = LoadedProviderStatus.error
        self.status = LoadedProviderStatus.ready

    async def _stream_notifications(self, task_group: TaskGroup):
        async for message in self.session.incoming_messages:
            match message:
                case types.ServerNotification(root=types.ResourceListChangedNotification()):
                    task_group.start_soon(self._load_features, {self._LoadFeature.resources})
                case types.ServerNotification(root=types.ToolListChangedNotification()):
                    task_group.start_soon(self._load_features, {self._LoadFeature.tools})
                case types.ServerNotification(root=types.PromptListChangedNotification()):
                    task_group.start_soon(self._load_features, {self._LoadFeature.prompts})
                case types.ServerNotification(root=types.AgentListChangedNotification()):
                    task_group.start_soon(self._load_features, {self._LoadFeature.agents})
            await self._write_messages.send(message)

    async def _initialize_session(self):
        try:
            await self._session_exit_stack.aclose()
        except Exception:
            self._session_exit_stack.pop_all()
        logger.info(f"Initializing session to provider {self.id}")
        read_stream, write_stream = await self._session_exit_stack.enter_async_context(
            self.provider.manifest.mcp_client()
        )
        session = await self._session_exit_stack.enter_async_context(ClientSession(read_stream, write_stream))
        with anyio.fail_after(self.INITIALIZE_TIMEOUT.total_seconds()):
            self._initialize_result = await session.initialize()
        tg = await self._session_exit_stack.enter_async_context(anyio.create_task_group())
        self._session_exit_stack.callback(lambda: tg.cancel_scope.cancel())

        self.session = session
        tg.start_soon(self._stream_notifications, tg)
        tg.start_soon(self._load_features)

    async def _ensure_session(self):
        if self._stopping:
            await self._session_exit_stack.aclose()
            self._stopped.set()
            return
        try:
            if self.session:
                with anyio.fail_after(self.PING_TIMEOUT.total_seconds()):
                    await self.session.send_ping()
                return
            await self._initialize_session()
        except TimeoutError:
            logger.warning("The server did not respond in time, we assume it is processing a request.")
        except Exception as ex:  # TODO narrow exception scope
            self.session = None
            logger.warning(f"Error connecting to {self.provider.id}: {ex!r}")
            self.last_error = repr(ex)
            self.status = LoadedProviderStatus.error

    async def __aenter__(self):
        self._stopping = False
        logger.info(f"Loading provider {self.id}")
        await self._writers_exit_stack.enter_async_context(self._write_messages)
        await self._ensure_session_periodic.start()

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self._writers_exit_stack.aclose()
        self._stopping = True
        self._ensure_session_periodic.poke()
        await self._stopped.wait()
        await self._ensure_session_periodic.stop()
        logger.info(f"Removing provider {self.id}")


@inject
class ProviderContainer:
    """
    Manage group of LoadedProvider instances:
      - react to changes in provider repository - add or remove providers as necessary
      - aggregate notifications from all providers using NotificationHub
    """

    RELOAD_PERIOD: Final = timedelta(minutes=1)

    def __init__(self, repository: IProviderRepository):
        self._periodic_reload: Periodic = Periodic(
            executor=self._reload,
            period=self.RELOAD_PERIOD,
            name="reload providers",
        )
        self.loaded_providers: list[LoadedProvider] = []
        self._repository = repository
        self._notification_hub = NotificationHub()

        # Cleanup
        self._stopping = False
        self._stopped = asyncio.Event()
        self._exit_stack = AsyncExitStack()

    @property
    def tools(self) -> list[Tool]:
        return [tool for p in self.loaded_providers for tool in p.tools]

    @property
    def agent_templates(self) -> list[AgentTemplate]:
        return [template for p in self.loaded_providers for template in p.agent_templates]

    @property
    def agents(self) -> list[Agent]:
        return [agent for p in self.loaded_providers for agent in p.agents]

    @property
    def resources(self) -> list[Resource]:
        return [resource for p in self.loaded_providers for resource in p.resources]

    @property
    def prompts(self) -> list[Prompt]:
        return [prompt for p in self.loaded_providers for prompt in p.prompts]

    @property
    def routing_table(self) -> dict[str, LoadedProvider]:
        return {
            **{f"tool/{tool.name}": p for p in self.loaded_providers for tool in p.tools},
            **{f"prompt/{prompt.name}": p for p in self.loaded_providers for prompt in p.prompts},
            **{f"resource/{resource.uri}": p for p in self.loaded_providers for resource in p.resources},
            **{f"agent/{agent.name}": p for p in self.loaded_providers for agent in p.agents},
            **{f"agent_template/{templ.name}": p for p in self.loaded_providers for templ in p.agent_templates},
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

    async def _reload(self):
        """
        Handle updates to providers repository.

        This function must enters various anyio CancelScopes internally. Hence all operations must be called from
        the same asyncio task to prevent stack corruption, for example by handling all operations through
        Periodic:
        https://anyio.readthedocs.io/en/stable/cancellation.html#avoiding-cancel-scope-stack-corruption
        """
        if self._stopping:
            for provider in self.loaded_providers:
                await provider.close()
            self.loaded_providers = []
            self._stopped.set()
            return

        repository_providers = [provider async for provider in self._repository.list()]
        repository_provider_ids = {provider.id for provider in repository_providers}

        added_providers = repository_provider_ids - {p.id for p in self.loaded_providers}
        added_providers = [LoadedProvider(p) for p in repository_providers if p.id in added_providers]
        removed_providers = [p for p in self.loaded_providers if p.id not in repository_provider_ids]
        unaffected_providers = [p for p in self.loaded_providers if p.id in repository_provider_ids]

        removed_providers and logger.info(f"Removing {len(removed_providers)} old providers")
        added_providers and logger.info(f"Discovered {len(added_providers)} new providers")

        for provider in removed_providers:
            await provider.close()
            await self._notification_hub.remove(provider)
        for provider in added_providers:
            await provider.init()
            await self._notification_hub.register(provider)
        self.loaded_providers = unaffected_providers + added_providers

    def handle_providers_change(self):
        self._periodic_reload.poke()

    async def __aenter__(self):
        self._stopping = False
        self._stopped.clear()
        await self._exit_stack.enter_async_context(self._notification_hub)
        await self._exit_stack.enter_async_context(self._periodic_reload)

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        self._stopping = True
        self._periodic_reload.poke()
        await self._stopped.wait()
        await self._exit_stack.aclose()

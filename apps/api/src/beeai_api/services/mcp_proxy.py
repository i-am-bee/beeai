import logging
from contextlib import AsyncExitStack, suppress
from functools import cached_property

from anyio.streams.memory import MemoryObjectReceiveStream, MemoryObjectSendStream
from kink import inject

from beeai_api.adapters.interface import IRegistryRepository
from beeai_api.domain.services import get_provider_connection
from mcp import types, ClientSession, Tool
from mcp.server import Server
from mcp.types import AgentTemplate

type MCPClient = tuple[
    MemoryObjectReceiveStream[types.JSONRPCMessage | Exception],
    MemoryObjectSendStream[types.JSONRPCMessage],
]

logger = logging.getLogger(__name__)


@inject
class MCPProxyServer:
    def __init__(self, registry_repository: IRegistryRepository):
        server = Server(name="beeai-platform-server", version="1.0.0")
        self._registry_repository = registry_repository
        self._exit_stack = AsyncExitStack()
        self._all_clients: list[MCPClient] = []
        self._all_tools: list[Tool] = []
        self._all_agents: list[AgentTemplate] = []
        self._clients_by_agent: dict[str, MCPClient] = {}
        self._clients_by_tool: dict[str, MCPClient] = {}

    async def __aenter__(self):
        logger.info("Initializing MCP proxy.")
        registries = [registry async for registry in self._registry_repository.list()]
        for registry in registries:
            connection = await get_provider_connection(registry)
            self._all_clients.append(self._exit_stack.enter_context(connection.mcp_client()))
        for client in self._all_clients:
            async with ClientSession(client[0], client[1]) as session:
                session: ClientSession

                with suppress(Exception):  # TODO what exception
                    tools = await session.list_tools()
                    for tool in tools.tools:
                        self._clients_by_tool[tool.name] = client
                        self._all_tools.append(tool)

                with suppress(Exception):  # TODO what exception
                    agents = await session.list_agent_templates()
                    for agent in agents.agentTemplates:
                        self._clients_by_agent[agent.name] = client
                        self._all_agents.append(agent)
        logger.info(f"Discovered {len(self._all_clients)} providers.")
        logger.info(f"Discovered {len(self._all_agents)} agent templates.")
        logger.info(f"Discovered {len(self._all_tools)} tools.")

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        logger.info("Shutting down MCP proxy.")
        await self._exit_stack.aclose()

    @cached_property
    def app(self):
        server = Server(name="beeai-platform-server", version="1.0.0")

        @server.list_tools()
        async def list_tools():
            return self._all_tools

        @server.call_tool()
        async def call_tool(name: str, arguments: dict):
            client = self._clients_by_tool[name]

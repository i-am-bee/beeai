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
import uuid
import time
from contextlib import asynccontextmanager
from functools import cached_property

import anyio
from anyio.streams.memory import MemoryObjectReceiveStream, MemoryObjectSendStream
from beeai_server.telemetry import INSTRUMENTATION_NAME
from kink import inject
from opentelemetry import metrics

from beeai_server.services.mcp_proxy.constants import NotificationStreamType
from acp import (
    ClientSession,
    CreateAgentRequest,
    CreateAgentResult,
    RunAgentResult,
    ListAgentsResult,
    ListAgentTemplatesResult,
)
from acp import ServerSession, types
from acp.server import Server
from acp.server.models import InitializationOptions
from acp.shared.session import ReceiveResultT
from acp.types import (
    CallToolRequestParams,
    ClientRequest,
    CallToolRequest,
    CallToolResult,
    RequestParams,
    RunAgentRequest,
    Request,
    DestroyAgentRequest,
    DestroyAgentResult,
)

from beeai_server.services.mcp_proxy.provider import ProviderContainer

logger = logging.getLogger(__name__)

meter = metrics.get_meter(INSTRUMENTATION_NAME)

AGENT_RUNS = meter.create_counter("agent_runs_total")
AGENT_RUN_DURATION = meter.create_histogram("agent_run_duration", "seconds")

TOOL_CALLS = meter.create_counter("tool_calls_total")
TOOL_CALL_DURATION = meter.create_histogram("tool_call_duration", "seconds")


@inject
class MCPProxyServer:
    def __init__(self, provider_container: ProviderContainer):
        self._provider_container = provider_container

    @asynccontextmanager
    async def _forward_progress_notifications(self, server):
        async with self._provider_container.forward_notifications(
            session=server.request_context.session,
            streams=NotificationStreamType.PROGRESS,
            request_context=server.request_context,
        ) as notifications:
            yield notifications

    async def _send_request_with_token(
        self,
        client_session: ClientSession,
        server: Server,
        request: Request,
        result_type: type[ReceiveResultT],
        forward_progress_notifications=True,
    ):
        request.model_extra.clear()
        if forward_progress_notifications:
            async with self._forward_progress_notifications(server):
                request.params.meta = server.request_context.meta or RequestParams.Meta()
                request.params.meta.progressToken = request.params.meta.progressToken or uuid.uuid4().hex
                resp = await client_session.send_request(ClientRequest(request), result_type)
        else:
            request = request.model_dump(exclude={"jsonrpc"})
            resp = await client_session.send_request(ClientRequest(request), result_type)
        return resp

    @cached_property
    def app(self):
        server = Server(name="beeai-platform-server", version="1.0.0")

        @server.list_tools()
        async def list_tools():
            return self._provider_container.tools

        @server.list_resources()
        async def list_resources():
            return self._provider_container.resources

        @server.list_prompts()
        async def list_prompts():
            return self._provider_container.prompts

        @server.list_agent_templates()
        async def list_agent_templates(_req):
            return ListAgentTemplatesResult(agentTemplates=self._provider_container.agent_templates)

        @server.list_agents()
        async def list_agents(_req):
            return ListAgentsResult(agents=self._provider_container.agents)

        @server.call_tool()
        async def call_tool(name: str, arguments: dict | None = None):
            result = "success"
            start_time = time.perf_counter()
            try:
                provider = self._provider_container.get_provider(f"tool/{name}")
                resp = await self._send_request_with_token(
                    provider.session,
                    server,
                    CallToolRequest(method="tools/call", params=CallToolRequestParams(name=name, arguments=arguments)),
                    CallToolResult,
                )
                return resp.content
            except:
                result = "failure"
                raise
            finally:
                duration = time.perf_counter() - start_time
                attributes = {"tool": name, "result": result}
                TOOL_CALLS.add(1, attributes)
                TOOL_CALL_DURATION.record(duration, attributes)

        @server.create_agent()
        async def create_agent(req: CreateAgentRequest) -> CreateAgentResult:
            provider = self._provider_container.get_provider(f"agent_template/{req.params.templateName}")
            return await self._send_request_with_token(provider.session, server, req, CreateAgentResult)

        @server.run_agent()
        async def run_agent(req: RunAgentRequest) -> RunAgentResult:
            result = "success"
            start_time = time.perf_counter()
            try:
                provider = self._provider_container.get_provider(f"agent/{req.params.name}")
                return await self._send_request_with_token(provider.session, server, req, RunAgentResult)
            except:
                result = "failure"
                raise
            finally:
                duration = time.perf_counter() - start_time
                attributes = {"agent": req.params.name, "result": result}
                AGENT_RUNS.add(1, attributes)
                AGENT_RUN_DURATION.record(duration, attributes)

        @server.destroy_agent()
        async def destroy_agent(req: DestroyAgentRequest) -> DestroyAgentResult:
            provider = self._provider_container.get_provider(f"agent/{req.params.name}")
            return await self._send_request_with_token(provider.session, server, req, DestroyAgentResult)

        return server

    async def run_server(
        self,
        read_stream: MemoryObjectReceiveStream[types.JSONRPCMessage | Exception],
        write_stream: MemoryObjectSendStream[types.JSONRPCMessage],
        initialization_options: InitializationOptions,
        raise_exceptions: bool = False,
    ):
        """
        HACK: Modified server.run method that subscribes and forwards messages
        The default method sets Request ContextVar only for client requests, not notifications.
        """
        async with ServerSession(read_stream, write_stream, initialization_options) as session:
            async with self._provider_container.forward_notifications(session):
                async with anyio.create_task_group() as tg:
                    async for message in session.incoming_messages:
                        logger.debug(f"Received message: {message}")
                        tg.start_soon(self.app._handle_message, message, session, raise_exceptions)

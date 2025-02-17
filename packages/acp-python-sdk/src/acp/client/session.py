from datetime import timedelta
from typing import Any

from anyio.streams.memory import MemoryObjectReceiveStream, MemoryObjectSendStream
from pydantic import AnyUrl

from acp.shared.session import BaseSession
from acp.shared.version import SUPPORTED_PROTOCOL_VERSIONS
from acp.types import (
    LATEST_PROTOCOL_VERSION,
    CallToolRequest,
    CallToolRequestParams,
    CallToolResult,
    ClientCapabilities,
    ClientNotification,
    ClientRequest,
    ClientResult,
    CompleteRequest,
    CompleteRequestParams,
    CompleteResult,
    CompletionArgument,
    CreateAgentRequest,
    CreateAgentRequestParams,
    CreateAgentResult,
    DestroyAgentRequest,
    DestroyAgentRequestParams,
    DestroyAgentResult,
    EmptyResult,
    GetPromptRequest,
    GetPromptRequestParams,
    GetPromptResult,
    Implementation,
    InitializedNotification,
    InitializeRequest,
    InitializeRequestParams,
    InitializeResult,
    JSONRPCMessage,
    ListAgentsRequest,
    ListAgentsResult,
    ListAgentTemplatesRequest,
    ListAgentTemplatesResult,
    ListPromptsRequest,
    ListPromptsResult,
    ListResourcesRequest,
    ListResourcesResult,
    ListResourceTemplatesRequest,
    ListResourceTemplatesResult,
    ListToolsRequest,
    ListToolsResult,
    LoggingLevel,
    PingRequest,
    ProgressNotification,
    ProgressNotificationParams,
    PromptReference,
    ReadResourceRequest,
    ReadResourceRequestParams,
    ReadResourceResult,
    ResourceReference,
    RootsCapability,
    RootsListChangedNotification,
    RunAgentRequest,
    RunAgentRequestParams,
    RunAgentResult,
    ServerNotification,
    ServerRequest,
    SetLevelRequest,
    SetLevelRequestParams,
    SubscribeRequest,
    SubscribeRequestParams,
    UnsubscribeRequest,
    UnsubscribeRequestParams,
)


class ClientSession(
    BaseSession[
        ClientRequest,
        ClientNotification,
        ClientResult,
        ServerRequest,
        ServerNotification,
    ]
):
    def __init__(
        self,
        read_stream: MemoryObjectReceiveStream[JSONRPCMessage | Exception],
        write_stream: MemoryObjectSendStream[JSONRPCMessage],
        read_timeout_seconds: timedelta | None = None,
    ) -> None:
        super().__init__(
            read_stream,
            write_stream,
            ServerRequest,
            ServerNotification,
            read_timeout_seconds=read_timeout_seconds,
        )

    async def initialize(self) -> InitializeResult:
        result = await self.send_request(
            ClientRequest(
                InitializeRequest(
                    method="initialize",
                    params=InitializeRequestParams(
                        protocolVersion=LATEST_PROTOCOL_VERSION,
                        capabilities=ClientCapabilities(
                            sampling=None,
                            experimental=None,
                            roots=RootsCapability(
                                # TODO: Should this be based on whether we
                                # _will_ send notifications, or only whether
                                # they're supported?
                                listChanged=True
                            ),
                        ),
                        clientInfo=Implementation(name="mcp", version="0.1.0"),
                    ),
                )
            ),
            InitializeResult,
        )

        if result.protocolVersion not in SUPPORTED_PROTOCOL_VERSIONS:
            raise RuntimeError(
                "Unsupported protocol version from the server: "
                f"{result.protocolVersion}"
            )

        await self.send_notification(
            ClientNotification(
                InitializedNotification(method="notifications/initialized")
            )
        )

        return result

    async def send_ping(self) -> EmptyResult:
        """Send a ping request."""
        return await self.send_request(
            ClientRequest(
                PingRequest(
                    method="ping",
                )
            ),
            EmptyResult,
        )

    async def send_progress_notification(
        self, progress_token: str | int, progress: float, total: float | None = None
    ) -> None:
        """Send a progress notification."""
        await self.send_notification(
            ClientNotification(
                ProgressNotification(
                    method="notifications/progress",
                    params=ProgressNotificationParams(
                        progressToken=progress_token,
                        progress=progress,
                        total=total,
                    ),
                ),
            )
        )

    async def set_logging_level(self, level: LoggingLevel) -> EmptyResult:
        """Send a logging/setLevel request."""
        return await self.send_request(
            ClientRequest(
                SetLevelRequest(
                    method="logging/setLevel",
                    params=SetLevelRequestParams(level=level),
                )
            ),
            EmptyResult,
        )

    async def list_resources(self) -> ListResourcesResult:
        """Send a resources/list request."""
        return await self.send_request(
            ClientRequest(
                ListResourcesRequest(
                    method="resources/list",
                )
            ),
            ListResourcesResult,
        )

    async def list_resource_templates(self) -> ListResourceTemplatesResult:
        """Send a resources/templates/list request."""
        return await self.send_request(
            ClientRequest(
                ListResourceTemplatesRequest(
                    method="resources/templates/list",
                )
            ),
            ListResourceTemplatesResult,
        )

    async def read_resource(self, uri: AnyUrl) -> ReadResourceResult:
        """Send a resources/read request."""
        return await self.send_request(
            ClientRequest(
                ReadResourceRequest(
                    method="resources/read",
                    params=ReadResourceRequestParams(uri=uri),
                )
            ),
            ReadResourceResult,
        )

    async def subscribe_resource(self, uri: AnyUrl) -> EmptyResult:
        """Send a resources/subscribe request."""
        return await self.send_request(
            ClientRequest(
                SubscribeRequest(
                    method="resources/subscribe",
                    params=SubscribeRequestParams(uri=uri),
                )
            ),
            EmptyResult,
        )

    async def unsubscribe_resource(self, uri: AnyUrl) -> EmptyResult:
        """Send a resources/unsubscribe request."""
        return await self.send_request(
            ClientRequest(
                UnsubscribeRequest(
                    method="resources/unsubscribe",
                    params=UnsubscribeRequestParams(uri=uri),
                )
            ),
            EmptyResult,
        )

    async def call_tool(
        self, name: str, arguments: dict | None = None
    ) -> CallToolResult:
        """Send a tools/call request."""
        return await self.send_request(
            ClientRequest(
                CallToolRequest(
                    method="tools/call",
                    params=CallToolRequestParams(name=name, arguments=arguments),
                )
            ),
            CallToolResult,
        )

    async def list_prompts(self) -> ListPromptsResult:
        """Send a prompts/list request."""
        return await self.send_request(
            ClientRequest(
                ListPromptsRequest(
                    method="prompts/list",
                )
            ),
            ListPromptsResult,
        )

    async def get_prompt(
        self, name: str, arguments: dict[str, str] | None = None
    ) -> GetPromptResult:
        """Send a prompts/get request."""
        return await self.send_request(
            ClientRequest(
                GetPromptRequest(
                    method="prompts/get",
                    params=GetPromptRequestParams(name=name, arguments=arguments),
                )
            ),
            GetPromptResult,
        )

    async def complete(
        self, ref: ResourceReference | PromptReference, argument: dict
    ) -> CompleteResult:
        """Send a completion/complete request."""
        return await self.send_request(
            ClientRequest(
                CompleteRequest(
                    method="completion/complete",
                    params=CompleteRequestParams(
                        ref=ref,
                        argument=CompletionArgument(**argument),
                    ),
                )
            ),
            CompleteResult,
        )

    async def list_tools(self) -> ListToolsResult:
        """Send a tools/list request."""
        return await self.send_request(
            ClientRequest(
                ListToolsRequest(
                    method="tools/list",
                )
            ),
            ListToolsResult,
        )

    async def send_roots_list_changed(self) -> None:
        """Send a roots/list_changed notification."""
        await self.send_notification(
            ClientNotification(
                RootsListChangedNotification(
                    method="notifications/roots/list_changed",
                )
            )
        )

    async def list_agent_templates(self) -> ListAgentTemplatesResult:
        """Send a agents/templates/list request."""
        return await self.send_request(
            ClientRequest(
                ListAgentTemplatesRequest(
                    method="agents/templates/list",
                )
            ),
            ListAgentTemplatesResult,
        )

    async def list_agents(self) -> ListAgentsResult:
        """Send a agents/list request."""
        return await self.send_request(
            ClientRequest(
                ListAgentsRequest(
                    method="agents/list",
                )
            ),
            ListAgentsResult,
        )

    async def create_agent(
        self, template_name: str, config: dict[str, Any]
    ) -> CreateAgentResult:
        """Send a agents/create request."""
        return await self.send_request(
            ClientRequest(
                CreateAgentRequest(
                    method="agents/create",
                    params=CreateAgentRequestParams(
                        templateName=template_name,
                        config=config,
                    ),
                )
            ),
            CreateAgentResult,
        )

    async def destroy_agent(self, name: str) -> DestroyAgentResult:
        """Send a agents/destroy request."""
        return await self.send_request(
            ClientRequest(
                DestroyAgentRequest(
                    method="agents/destroy",
                    params=DestroyAgentRequestParams(name=name),
                )
            ),
            DestroyAgentResult,
        )

    async def run_agent(self, name: str, input: dict[str, Any]) -> RunAgentResult:
        """Send a agents/run request."""
        return await self.send_request(
            ClientRequest(
                RunAgentRequest(
                    method="agents/run",
                    params=RunAgentRequestParams(name=name, input=input),
                )
            ),
            RunAgentResult,
        )

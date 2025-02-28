"""FastMCP - A more ergonomic interface for MCP servers."""

import inspect
import json
import re
from itertools import chain
from typing import Any, Callable, Literal, Sequence, Type

import anyio
import pydantic_core
import uvicorn
from pydantic import BaseModel, Field
from pydantic.networks import AnyUrl
from pydantic_settings import BaseSettings, SettingsConfigDict

from acp.server.highlevel.agents import Agent, AgentManager, AgentTemplate
from acp.server.highlevel.context import Context
from acp.server.highlevel.exceptions import ResourceError
from acp.server.highlevel.prompts import Prompt, PromptManager
from acp.server.highlevel.resources import FunctionResource, Resource, ResourceManager
from acp.server.highlevel.tools import ToolManager
from acp.server.highlevel.utilities.logging import configure_logging, get_logger
from acp.server.highlevel.utilities.types import Image
from acp.server.lowlevel import Server as MCPServer
from acp.server.lowlevel.helper_types import ReadResourceContents
from acp.server.sse import SseServerTransport
from acp.server.stdio import stdio_server
from acp.types import (
    Agent as MCPAgent,
)
from acp.types import (
    AgentTemplate as MCPAgentTemplate,
)
from acp.types import (
    AnyFunction,
    CreateAgentRequest,
    CreateAgentResult,
    DestroyAgentRequest,
    DestroyAgentResult,
    EmbeddedResource,
    GetPromptResult,
    ImageContent,
    ListAgentsRequest,
    ListAgentsResult,
    ListAgentTemplatesRequest,
    ListAgentTemplatesResult,
    RunAgentRequest,
    RunAgentResult,
    TextContent,
)
from acp.types import (
    Prompt as MCPPrompt,
)
from acp.types import (
    PromptArgument as MCPPromptArgument,
)
from acp.types import (
    Resource as MCPResource,
)
from acp.types import (
    ResourceTemplate as MCPResourceTemplate,
)
from acp.types import (
    Tool as MCPTool,
)

logger = get_logger(__name__)


class Settings(BaseSettings):
    """FastMCP server settings.

    All settings can be configured via environment variables with the prefix FASTMCP_.
    For example, FASTMCP_DEBUG=true will set debug=True.
    """

    model_config = SettingsConfigDict(
        env_prefix="FASTMCP_",
        env_file=".env",
        extra="ignore",
    )

    # Server settings
    debug: bool = False
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"

    # HTTP settings
    host: str = "0.0.0.0"
    port: int = 8000

    # resource settings
    warn_on_duplicate_resources: bool = True

    # tool settings
    warn_on_duplicate_tools: bool = True

    # prompt settings
    warn_on_duplicate_prompts: bool = True

    # agent settings
    warn_on_duplicate_agents: bool = True

    dependencies: list[str] = Field(
        default_factory=list,
        description="List of dependencies to install in the server environment",
    )


class Server:
    def __init__(
        self, name: str | None = None, instructions: str | None = None, **settings: Any
    ):
        self.settings = Settings(**settings)
        self._mcp_server = MCPServer(name=name or "FastMCP", instructions=instructions)
        self._tool_manager = ToolManager(
            warn_on_duplicate_tools=self.settings.warn_on_duplicate_tools
        )
        self._resource_manager = ResourceManager(
            warn_on_duplicate_resources=self.settings.warn_on_duplicate_resources
        )
        self._prompt_manager = PromptManager(
            warn_on_duplicate_prompts=self.settings.warn_on_duplicate_prompts
        )
        self._agent_manager = AgentManager(
            warn_on_duplicate_agents=self.settings.warn_on_duplicate_agents
        )
        self.dependencies = self.settings.dependencies

        # Set up MCP protocol handlers
        self._setup_handlers()

        # Configure logging
        configure_logging(self.settings.log_level)

    @property
    def name(self) -> str:
        return self._mcp_server.name

    @property
    def instructions(self) -> str | None:
        return self._mcp_server.instructions

    def run(self, transport: Literal["stdio", "sse"] = "stdio") -> None:
        """Run the FastMCP server. Note this is a synchronous function.

        Args:
            transport: Transport protocol to use ("stdio" or "sse")
        """
        TRANSPORTS = Literal["stdio", "sse"]
        if transport not in TRANSPORTS.__args__:  # type: ignore
            raise ValueError(f"Unknown transport: {transport}")

        if transport == "stdio":
            anyio.run(self.run_stdio_async)
        else:  # transport == "sse"
            anyio.run(self.run_sse_async)

    def _setup_handlers(self) -> None:
        """Set up core MCP protocol handlers."""
        self._mcp_server.list_tools()(self.list_tools)
        self._mcp_server.call_tool()(self.call_tool)
        self._mcp_server.list_resources()(self.list_resources)
        self._mcp_server.read_resource()(self.read_resource)
        self._mcp_server.list_prompts()(self.list_prompts)
        self._mcp_server.get_prompt()(self.get_prompt)
        self._mcp_server.list_resource_templates()(self.list_resource_templates)
        self._mcp_server.list_agent_templates()(self.list_agent_templates)
        self._mcp_server.list_agents()(self.list_agents)
        self._mcp_server.create_agent()(self.create_agent)
        self._mcp_server.destroy_agent()(self.destroy_agent)
        self._mcp_server.run_agent()(self.run_agent)

    async def list_tools(self) -> list[MCPTool]:
        """List all available tools."""
        tools = self._tool_manager.list_tools()
        return [
            MCPTool(
                name=info.name,
                description=info.description,
                inputSchema=info.parameters,
            )
            for info in tools
        ]

    def get_context(self) -> Context:
        """
        Returns a Context object. Note that the context will only be valid
        during a request; outside a request, most methods will error.
        """
        try:
            request_context = self._mcp_server.request_context
        except LookupError:
            request_context = None
        return Context(request_context=request_context, fastmcp=self)

    async def call_tool(
        self, name: str, arguments: dict[str, Any]
    ) -> Sequence[TextContent | ImageContent | EmbeddedResource]:
        """Call a tool by name with arguments."""
        context = self.get_context()
        result = await self._tool_manager.call_tool(name, arguments, context=context)
        converted_result = _convert_to_content(result)
        return converted_result

    async def list_resources(self) -> list[MCPResource]:
        """List all available resources."""

        resources = self._resource_manager.list_resources()
        return [
            MCPResource(
                uri=resource.uri,
                name=resource.name or "",
                description=resource.description,
                mimeType=resource.mime_type,
            )
            for resource in resources
        ]

    async def list_resource_templates(self) -> list[MCPResourceTemplate]:
        templates = self._resource_manager.list_templates()
        return [
            MCPResourceTemplate(
                uriTemplate=template.uri_template,
                name=template.name,
                description=template.description,
            )
            for template in templates
        ]

    async def read_resource(self, uri: AnyUrl | str) -> ReadResourceContents:
        """Read a resource by URI."""

        resource = await self._resource_manager.get_resource(uri)
        if not resource:
            raise ResourceError(f"Unknown resource: {uri}")

        try:
            content = await resource.read()
            return ReadResourceContents(content=content, mime_type=resource.mime_type)
        except Exception as e:
            logger.error(f"Error reading resource {uri}: {e}")
            raise ResourceError(str(e))

    def add_tool(
        self,
        fn: AnyFunction,
        name: str | None = None,
        description: str | None = None,
    ) -> None:
        """Add a tool to the server.

        The tool function can optionally request a Context object by adding a parameter
        with the Context type annotation. See the @tool decorator for examples.

        Args:
            fn: The function to register as a tool
            name: Optional name for the tool (defaults to function name)
            description: Optional description of what the tool does
        """
        self._tool_manager.add_tool(fn, name=name, description=description)

    def tool(
        self, name: str | None = None, description: str | None = None
    ) -> Callable[[AnyFunction], AnyFunction]:
        """Decorator to register a tool.

        Tools can optionally request a Context object by adding a parameter with the
        Context type annotation. The context provides access to MCP capabilities like
        logging, progress reporting, and resource access.

        Args:
            name: Optional name for the tool (defaults to function name)
            description: Optional description of what the tool does

        Example:
            @server.tool()
            def my_tool(x: int) -> str:
                return str(x)

            @server.tool()
            def tool_with_context(x: int, ctx: Context) -> str:
                ctx.info(f"Processing {x}")
                return str(x)

            @server.tool()
            async def async_tool(x: int, context: Context) -> str:
                await context.report_progress(50, 100)
                return str(x)
        """
        # Check if user passed function directly instead of calling decorator
        if callable(name):
            raise TypeError(
                "The @tool decorator was used incorrectly. "
                "Did you forget to call it? Use @tool() instead of @tool"
            )

        def decorator(fn: AnyFunction) -> AnyFunction:
            self.add_tool(fn, name=name, description=description)
            return fn

        return decorator

    def add_resource(self, resource: Resource) -> None:
        """Add a resource to the server.

        Args:
            resource: A Resource instance to add
        """
        self._resource_manager.add_resource(resource)

    def resource(
        self,
        uri: str,
        *,
        name: str | None = None,
        description: str | None = None,
        mime_type: str | None = None,
    ) -> Callable[[AnyFunction], AnyFunction]:
        """Decorator to register a function as a resource.

        The function will be called when the resource is read to generate its content.
        The function can return:
        - str for text content
        - bytes for binary content
        - other types will be converted to JSON

        If the URI contains parameters (e.g. "resource://{param}") or the function
        has parameters, it will be registered as a template resource.

        Args:
            uri: URI for the resource (e.g. "resource://my-resource" or "resource://{param}")
            name: Optional name for the resource
            description: Optional description of the resource
            mime_type: Optional MIME type for the resource

        Example:
            @server.resource("resource://my-resource")
            def get_data() -> str:
                return "Hello, world!"

            @server.resource("resource://my-resource")
            async get_data() -> str:
                data = await fetch_data()
                return f"Hello, world! {data}"

            @server.resource("resource://{city}/weather")
            def get_weather(city: str) -> str:
                return f"Weather for {city}"

            @server.resource("resource://{city}/weather")
            async def get_weather(city: str) -> str:
                data = await fetch_weather(city)
                return f"Weather for {city}: {data}"
        """
        # Check if user passed function directly instead of calling decorator
        if callable(uri):
            raise TypeError(
                "The @resource decorator was used incorrectly. "
                "Did you forget to call it? Use @resource('uri') instead of @resource"
            )

        def decorator(fn: AnyFunction) -> AnyFunction:
            # Check if this should be a template
            has_uri_params = "{" in uri and "}" in uri
            has_func_params = bool(inspect.signature(fn).parameters)

            if has_uri_params or has_func_params:
                # Validate that URI params match function params
                uri_params = set(re.findall(r"{(\w+)}", uri))
                func_params = set(inspect.signature(fn).parameters.keys())

                if uri_params != func_params:
                    raise ValueError(
                        f"Mismatch between URI parameters {uri_params} "
                        f"and function parameters {func_params}"
                    )

                # Register as template
                self._resource_manager.add_template(
                    fn=fn,
                    uri_template=uri,
                    name=name,
                    description=description,
                    mime_type=mime_type or "text/plain",
                )
            else:
                # Register as regular resource
                resource = FunctionResource(
                    uri=AnyUrl(uri),
                    name=name,
                    description=description,
                    mime_type=mime_type or "text/plain",
                    fn=fn,
                )
                self.add_resource(resource)
            return fn

        return decorator

    def add_prompt(self, prompt: Prompt) -> None:
        """Add a prompt to the server.

        Args:
            prompt: A Prompt instance to add
        """
        self._prompt_manager.add_prompt(prompt)

    def prompt(
        self, name: str | None = None, description: str | None = None
    ) -> Callable[[AnyFunction], AnyFunction]:
        """Decorator to register a prompt.

        Args:
            name: Optional name for the prompt (defaults to function name)
            description: Optional description of what the prompt does

        Example:
            @server.prompt()
            def analyze_table(table_name: str) -> list[Message]:
                schema = read_table_schema(table_name)
                return [
                    {
                        "role": "user",
                        "content": f"Analyze this schema:\n{schema}"
                    }
                ]

            @server.prompt()
            async def analyze_file(path: str) -> list[Message]:
                content = await read_file(path)
                return [
                    {
                        "role": "user",
                        "content": {
                            "type": "resource",
                            "resource": {
                                "uri": f"file://{path}",
                                "text": content
                            }
                        }
                    }
                ]
        """
        # Check if user passed function directly instead of calling decorator
        if callable(name):
            raise TypeError(
                "The @prompt decorator was used incorrectly. "
                "Did you forget to call it? Use @prompt() instead of @prompt"
            )

        def decorator(func: AnyFunction) -> AnyFunction:
            prompt = Prompt.from_function(func, name=name, description=description)
            self.add_prompt(prompt)
            return func

        return decorator

    def add_agent_template(self, template: AgentTemplate) -> None:
        """Add a agent to the server."""

        self._agent_manager.add_template(template=template)

    def agent_template(
        self,
        name: str,
        description: str,
        config: Type[BaseModel],
        input: Type[BaseModel],
        output: Type[BaseModel],
        **kwargs,
    ) -> Callable:
        """Decorator to register an agent template.

        Args:
            name: name for the agent
            description: description of what the agent does
            config: agent configuration model
            input: agent run input model
            output: agent run output model
        """
        # Check if user passed function directly instead of calling decorator
        if callable(name):
            raise TypeError(
                "The @agent_template decorator was used incorrectly. "
                "Did you forget to call it? Use @agent_template()"
                + " instead of @agent_template"
            )

        def decorator(func: Callable) -> Callable:
            template = AgentTemplate(
                name=name,
                description=description,
                config=config,
                input=input,
                output=output,
                create_fn=func,
                **kwargs,
            )
            self.add_agent_template(template)
            return func

        return decorator

    async def list_agent_templates(
        self, req: ListAgentTemplatesRequest
    ) -> ListAgentTemplatesResult:
        templates = self._agent_manager.list_templates()
        return ListAgentTemplatesResult(
            agentTemplates=[
                MCPAgentTemplate(
                    name=template.name,
                    description=template.description,
                    configSchema=template.config.model_json_schema(),
                    inputSchema=template.input.model_json_schema(),
                    outputSchema=template.output.model_json_schema(),
                    **(template.model_extra if template.model_extra else {}),
                )
                for template in templates
            ]
        )

    def add_agent(self, agent: Agent) -> None:
        """Add a agent to the server."""
        self._agent_manager.add_agent(agent=agent)

    def agent(
        self,
        name: str,
        description: str,
        input: Type[BaseModel],
        output: Type[BaseModel],
        **kwargs,
    ) -> Callable:
        """Decorator to register an agent.

        Args:
            name: name for the agent
            description: description of what the agent does
            input: agent run input model
            output: agent run output model
        """
        # Check if user passed function directly instead of calling decorator
        if callable(name):
            raise TypeError(
                "The @agent decorator was used incorrectly. "
                "Did you forget to call it? Use @agent() instead of @agent"
            )

        def decorator(func: Callable) -> Callable:
            agent = Agent(
                name=name,
                description=description,
                input=input,
                output=output,
                run_fn=func,
                destroy_fn=None,
                **kwargs,
            )
            self.add_agent(agent=agent)
            return func

        return decorator

    async def list_agents(self, req: ListAgentsRequest) -> ListAgentsResult:
        agents = self._agent_manager.list_agents()
        return ListAgentsResult(
            agents=[
                MCPAgent(
                    name=agent.name,
                    description=agent.description,
                    inputSchema=agent.input.model_json_schema(),
                    outputSchema=agent.output.model_json_schema(),
                    **(agent.model_extra if agent.model_extra else {}),
                )
                for agent in agents
            ]
        )

    async def create_agent(self, req: CreateAgentRequest) -> CreateAgentResult:
        agent = await self._agent_manager.create_agent(
            name=req.params.templateName,
            config=req.params.config,
            context=self.get_context(),
        )
        return CreateAgentResult(
            agent=MCPAgent(
                name=agent.name,
                description=agent.description,
                inputSchema=agent.input.model_json_schema(),
                outputSchema=agent.output.model_json_schema(),
            )
        )

    async def destroy_agent(self, req: DestroyAgentRequest) -> DestroyAgentResult:
        await self._agent_manager.destroy_agent(
            name=req.params.name, context=self.get_context()
        )
        return DestroyAgentResult()

    async def run_agent(self, req: RunAgentRequest) -> RunAgentResult:
        """Run an agent by name with arguments."""
        output = await self._agent_manager.run_agent(
            name=req.params.name, input=req.params.input, context=self.get_context()
        )
        return RunAgentResult(output=output)

    async def run_stdio_async(self) -> None:
        """Run the server using stdio transport."""
        async with stdio_server() as (read_stream, write_stream):
            await self._mcp_server.run(
                read_stream,
                write_stream,
                self._mcp_server.create_initialization_options(),
            )

    async def run_sse_async(self, **uvicorn_kwargs) -> None:
        """Run the server using SSE transport."""
        from starlette.applications import Starlette
        from starlette.routing import Mount, Route

        sse = SseServerTransport("/messages/")

        async def handle_sse(request):
            async with sse.connect_sse(
                request.scope, request.receive, request._send
            ) as streams:
                await self._mcp_server.run(
                    streams[0],
                    streams[1],
                    self._mcp_server.create_initialization_options(),
                )

        starlette_app = Starlette(
            debug=self.settings.debug,
            routes=[
                Route("/sse", endpoint=handle_sse),
                Mount("/messages/", app=sse.handle_post_message),
            ],
        )

        config = uvicorn.Config(
            starlette_app,
            host=self.settings.host,
            port=self.settings.port,
            log_level=self.settings.log_level.lower(),
            **uvicorn_kwargs,
        )
        server = uvicorn.Server(config)
        await server.serve()

    async def list_prompts(self) -> list[MCPPrompt]:
        """List all available prompts."""
        prompts = self._prompt_manager.list_prompts()
        return [
            MCPPrompt(
                name=prompt.name,
                description=prompt.description,
                arguments=[
                    MCPPromptArgument(
                        name=arg.name,
                        description=arg.description,
                        required=arg.required,
                    )
                    for arg in (prompt.arguments or [])
                ],
            )
            for prompt in prompts
        ]

    async def get_prompt(
        self, name: str, arguments: dict[str, Any] | None = None
    ) -> GetPromptResult:
        """Get a prompt by name with arguments."""
        try:
            messages = await self._prompt_manager.render_prompt(name, arguments)

            return GetPromptResult(messages=pydantic_core.to_jsonable_python(messages))
        except Exception as e:
            logger.error(f"Error getting prompt {name}: {e}")
            raise ValueError(str(e))


def _convert_to_content(
    result: Any,
) -> Sequence[TextContent | ImageContent | EmbeddedResource]:
    """Convert a result to a sequence of content objects."""
    if result is None:
        return []

    if isinstance(result, (TextContent, ImageContent, EmbeddedResource)):
        return [result]

    if isinstance(result, Image):
        return [result.to_image_content()]

    if isinstance(result, (list, tuple)):
        return list(chain.from_iterable(_convert_to_content(item) for item in result))

    if not isinstance(result, str):
        try:
            result = json.dumps(pydantic_core.to_jsonable_python(result))
        except Exception:
            result = str(result)

    return [TextContent(type="text", text=result)]

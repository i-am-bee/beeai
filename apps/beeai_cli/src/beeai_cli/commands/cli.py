import asyncio
import uuid
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import click
import requests
import yaml
from asgiref.sync import async_to_sync

from beeai_cli.configuration import get_configuration
from beeai_cli.utils import parse_key_value_args
from mcp import ClientSession, ClientRequest, CallToolRequest
from mcp.client.sse import sse_client
from mcp.shared.session import ReceiveResultT
from mcp.types import (
    RequestParams,
    CallToolResult,
    CallToolRequestParams,
    RunAgentRequest,
    RunAgentResult,
    RunAgentRequestParams,
)


@click.group()
def cli():
    pass


@cli.group()
def provider():
    pass


def url(path):
    return str(get_configuration().server_url).rstrip("/") + "/" + path


@asynccontextmanager
async def mcp_client() -> AsyncGenerator[ClientSession]:
    async with sse_client(url=url("mcp/sse")) as (read_stream, write_stream):
        async with ClientSession(read_stream, write_stream) as session:
            yield session


@provider.command(name="add")
@click.argument("provider_url")
def provider_add(provider_url: str):
    """Add a path to the provider."""
    requests.post(url("provider"), json={"url": provider_url})
    click.echo(f"Added provider: {provider_url}")


@provider.command(name="ls")
def provider_list():
    """List all paths in the provider."""
    response = requests.get(url("provider")).json()
    click.echo(yaml.dump(response))


@provider.command(name="remove")
@click.argument("provider_url")
def provider_remove(provider_url: str):
    """Remove a path from the provider."""
    requests.post(url("provider/delete"), json={"url": provider_url})
    click.echo(f"Removed path: {provider_url}")


@cli.command(name="list")
@click.argument("what", type=click.Choice(["tools", "agents"]))
@async_to_sync
async def list_items(what: str):
    async with mcp_client() as client:
        client: ClientSession
        await client.initialize()
        match what:
            case "tools":
                res = await client.list_tools()
                res = res.model_dump(mode="json")["tools"]
            case "agents":
                res = await client.list_agent_templates()
                res = res.model_dump(mode="json")["agentTemplates"]
        click.echo(yaml.dump(res, indent=2))


async def send_request(request: ClientRequest, result_type: type[ReceiveResultT]):
    async with mcp_client() as session:
        await session.initialize()

        request.params.meta = RequestParams.Meta(progressToken=uuid.uuid4().hex)
        task = asyncio.create_task(session.send_request(request, result_type))

        # TODO IMPORTANT(!) if the client does not read the notifications, it gets blocked never receiving the response!
        async def read_notifications():
            async for message in session.incoming_messages:
                click.echo(yaml.dump(message.model_dump(mode="json"), indent=2))

        notif_task = asyncio.create_task(read_notifications())
        result = await task
        result = result.model_dump(mode="json")
        click.echo(yaml.dump(result, indent=2))
        click.echo("Done")


@cli.command(name="call_tool")
@click.argument("tool-name")
@click.argument("args", nargs=-1)
def call_tool(tool_name: str, args: tuple):
    args = parse_key_value_args(args)
    asyncio.run(
        send_request(
            CallToolRequest(method="tools/call", params=CallToolRequestParams(name=tool_name, arguments=args)),
            CallToolResult,
        )
    )


@cli.command(name="run_agent")
@click.argument("agent-name")
@click.argument("prompt")
def run_agent(agent_name: str, prompt: str):
    asyncio.run(
        send_request(
            RunAgentRequest(method="agents/run", params=RunAgentRequestParams(name=agent_name, prompt=prompt)),
            RunAgentResult,
        )
    )

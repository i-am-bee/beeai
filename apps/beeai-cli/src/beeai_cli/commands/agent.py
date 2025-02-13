import sys

import typer
from mcp import types, ServerNotification, RunAgentResult
from mcp.types import AgentRunProgressNotification, AgentRunProgressNotificationParams

from beeai_cli.api import send_request, send_request_with_notifications
from beeai_cli.async_typer import AsyncTyper
from beeai_cli.utils import format_model

app = AsyncTyper()


@app.command("run")
async def run(
    name: str = typer.Argument(help="Name of the tool to call"),
    prompt: str = typer.Argument(help="Agent prompt"),
) -> None:
    """Call a tool with given input."""
    text_streamed = False
    async for message in send_request_with_notifications(
        types.RunAgentRequest(
            method="agents/run", params=types.RunAgentRequestParams(name=name, input=dict(prompt=prompt))
        ),
        types.RunAgentResult,
    ):
        match message:
            case ServerNotification(
                root=AgentRunProgressNotification(params=AgentRunProgressNotificationParams(delta=delta))
            ):
                for log in filter(bool, delta.get("logs", [])):
                    if text := log.get("text", None):
                        typer.echo(f"Log: {text.strip()}", file=sys.stderr)

                if text := delta.get("text", None):
                    typer.echo(text, nl=False)
                    text_streamed = True
            case RunAgentResult() as result:
                if not text_streamed:
                    typer.echo(format_model(result))
                else:
                    typer.echo()


@app.command("list")
async def list_agents():
    result = await send_request(types.ListAgentsRequest(method="agents/list"), types.ListAgentsResult)
    typer.echo(format_model(result.agents))

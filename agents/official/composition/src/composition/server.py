import asyncio
from typing import Any, Iterable

from pydantic import Field, BaseModel

from acp import RunAgentRequest, RunAgentResult
from acp.server.highlevel import Server, Context
from acp.server.highlevel.agents import Agent
from acp.server.highlevel.exceptions import AgentError
from acp.types import (
    RunAgentRequestParams,
    ServerNotification,
    AgentRunProgressNotification,
    AgentRunProgressNotificationParams,
)
from beeai_sdk.providers.agent import run_agent_provider
from beeai_sdk.schemas.base import TextInput, TextOutput, Input
from beeai_sdk.schemas.message import MessageInput
from beeai_sdk.schemas.metadata import Metadata
from beeai_sdk.utils.api import send_request_with_notifications, mcp_client
from composition.configuration import Configuration
from composition.utils import extract_messages


class SequentialAgentWorkflowInput(Input):
    """Input schema must match the first agent (not checked)"""

    agents: list[str] = Field(min_length=1)
    input: TextInput | MessageInput


class AgentOutputDelta(BaseModel):
    output: dict[str, Any]


def validate_agents(agents: Iterable[str], server_agents: list[Agent]):
    agents = set(agents)
    if missing_agents := (agents - {a.name for a in server_agents}):
        raise ValueError(f"The following agents are missing: {missing_agents}")
    for agent in (a for a in server_agents if a.name in agents):
        input_property = agent.inputSchema.get("properties", {}).get("text", {})
        output_property = agent.outputSchema.get("properties", {}).get("text", {})
        for text_prop, schema_type, schema in [(input_property, "input"), (output_property, "output")]:
            if text_prop.get("type", None) != "string":
                raise NotImplementedError(
                    "Only text agents are currently supported for workflow.\n"
                    f"Agent '{agent.name}' is missing the 'text' property in the {schema_type} schema."
                )


async def run():
    server = Server("composition-agents")

    @server.agent(
        "sequential-workflow",
        "Run agents in a sequential workflow",
        input=SequentialAgentWorkflowInput,
        output=TextInput,
        **Metadata(framework="CrewAI", licence="Apache 2.0").model_dump(),
    )
    async def run_sequential_workflow(input: SequentialAgentWorkflowInput, ctx: Context) -> TextOutput:
        output = TextOutput(text="")
        agent_input = input.input
        agent = None
        try:
            async with mcp_client(url=Configuration().mcp_url) as session:
                resp = await session.list_agents()
                validate_agents(input.agents, resp.agents)

                for idx, agent in enumerate(input.agents):
                    async for message in send_request_with_notifications(
                        session,
                        req=RunAgentRequest(
                            method="agents/run",
                            params=RunAgentRequestParams(name=agent, input=agent_input),
                        ),
                        result_type=RunAgentResult,
                    ):
                        match message:
                            case ServerNotification(
                                root=AgentRunProgressNotification(
                                    params=AgentRunProgressNotificationParams(delta=output_delta_dict)
                                )
                            ):
                                output_delta = TextOutput.model_validate(output_delta_dict)
                                output_delta.agent_name = agent
                                await ctx.report_agent_run_progress(delta=output_delta)
                            case RunAgentResult(output=output_delta_dict):
                                output_delta = TextOutput.model_validate(output_delta_dict)
                                output_delta.agent_name = agent
                                if idx == len(input.agents) - 1:
                                    output = output_delta
                                    break
                                await ctx.report_agent_run_progress(delta=output_delta)
                                agent_input = output_delta_dict
        except Exception as e:
            agent_msg = f"{agent} - " if agent else ""
            raise AgentError(f"{agent_msg}{extract_messages(e)}") from e
        return output

    await run_agent_provider(server)


def main():
    asyncio.run(run())


if __name__ == "__main__":
    main()

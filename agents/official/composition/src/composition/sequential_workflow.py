from typing import Any

from pydantic import Field, BaseModel

from acp import Agent


from acp import RunAgentRequest, RunAgentResult
from acp.server.highlevel import Context, Server
from acp.server.highlevel.exceptions import AgentError
from acp.types import (
    RunAgentRequestParams,
    ServerNotification,
    AgentRunProgressNotification,
    AgentRunProgressNotificationParams,
)
from beeai_sdk.schemas.base import Input, Log, LogLevel, Output
from beeai_sdk.schemas.message import UserMessage
from beeai_sdk.schemas.metadata import Metadata
from beeai_sdk.utils.api import send_request_with_notifications, mcp_client
from composition.configuration import Configuration
from composition.utils import extract_messages


class SequentialAgentWorkflowInput(Input):
    """Input schema must match the first agent (not checked)"""

    agents: list[str] = Field(min_length=1)
    input: dict[str, Any]


class AgentOutputDelta(BaseModel):
    output: dict[str, Any]


def transform_agent_output(output: dict[str, Any], input_schema: dict[str, Any]):
    required_input_properties = set(input_schema.get("required", []))
    if required_input_properties == {"text"}:
        return {"text": output.get("text", str(output))}
    if required_input_properties == {"messages"}:
        if messages := output.get("messages", []):
            # TODO chat history is forgotten between agents
            return {"messages": [UserMessage(role="user", content=messages[-1]["content"])]}
        text = output.get("text", str(output))
        return {"messages": [UserMessage(role="user", content=text).model_dump()]}
    if missing_properties := required_input_properties - output.keys():
        raise ValueError(f"Missing input properties: {missing_properties}")
    return {key: value for key, value in output.items() if key in required_input_properties}


def validate_agents(input: SequentialAgentWorkflowInput, server_agents: dict[str, Agent]):
    if missing_agents := (set(input.agents) - server_agents.keys()):
        raise ValueError(f"The following agents are missing: {missing_agents}")

    agent_defs = [server_agents[agent] for agent in input.agents]

    try:
        transform_agent_output(input.input, agent_defs[0].inputSchema)
    except ValueError as ex:
        raise ValueError(f"Input is not compatible with the first agent: {ex}") from ex

    for agent, next_agent in zip(agent_defs, agent_defs[1:]):
        required_output_properties = set(agent.outputSchema.get("required", []))
        required_input_properties = set(next_agent.inputSchema.get("required", []))

        if required_input_properties in [{"text"}, {"messages"}]:
            continue  # special case - output of previous agent will be serialized to text or message

        if missing_properties := (required_input_properties - required_output_properties):
            raise ValueError(
                f"Incompatible agents: Output from agent '{agent.name}' is missing required input "
                f"properties of agent '{next_agent.outputSchema}': {missing_properties}",
            )


def add_sequential_workflow_agent(server: Server):
    @server.agent(
        "sequential-workflow",
        "Run agents in a sequential workflow",
        input=SequentialAgentWorkflowInput,
        output=Output,
        **Metadata(framework=None, licence="Apache 2.0").model_dump(),
        composition_agent=True,
    )
    async def run_sequential_workflow(input: SequentialAgentWorkflowInput, ctx: Context) -> Output:
        output = Output()
        agent = None
        try:
            async with mcp_client(url=Configuration().mcp_url) as session:
                resp = await session.list_agents()
                server_agents_by_name = {a.name: a for a in resp.agents}
                validate_agents(input, server_agents_by_name)

                agent_input = transform_agent_output(input.input, server_agents_by_name[input.agents[0]].inputSchema)

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
                                output_delta = Output.model_validate(output_delta_dict)
                                output_delta.agent_name = agent
                                await ctx.report_agent_run_progress(delta=output_delta)
                            case RunAgentResult(output=output_delta_dict):
                                output_delta = Output.model_validate(output_delta_dict)
                                output_delta.agent_name = agent
                                if idx == len(input.agents) - 1:
                                    output = output_delta
                                    break

                                output_serialized = str(output_delta.model_dump())
                                message = f"{output_serialized[:100] + '...' if len(output_serialized) > 100 else output_serialized}"
                                await ctx.report_agent_run_progress(
                                    delta=Output(
                                        logs=[
                                            None,
                                            Log(
                                                level=LogLevel.success,
                                                message=f"✅ Agent {agent}[{idx}] finished successfully: {message}",
                                            ),
                                        ]
                                    )
                                )
                                agent_input = transform_agent_output(
                                    output_delta_dict, server_agents_by_name[input.agents[idx + 1]].inputSchema
                                )
        except Exception as e:
            agent_msg = f"{agent}[{idx}] - " if agent else ""
            raise AgentError(f"{agent_msg}{extract_messages(e)}") from e
        return output

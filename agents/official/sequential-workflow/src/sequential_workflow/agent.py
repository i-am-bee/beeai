from typing import Any

import yaml
from pydantic import Field, BaseModel

from acp import Agent
from acp import RunAgentRequest, RunAgentResult
from beeai_sdk.providers.agent import Server
from acp.server.highlevel.exceptions import AgentError
from acp.types import (
    RunAgentRequestParams,
    ServerNotification,
    AgentRunProgressNotification,
    AgentRunProgressNotificationParams,
)
from beeai_sdk.schemas.base import Input, Log, LogLevel, Output
from beeai_sdk.utils.api import send_request_with_notifications, mcp_client
from sequential_workflow.configuration import Configuration
from sequential_workflow.utils import extract_messages


class WorkflowStep(BaseModel):
    agent: str
    instruction: str


class SequentialWorkflowInput(Input):
    steps: list[WorkflowStep] = Field(min_length=1)
    input: str = Field(default_factory=str)


def validate_agents(input: SequentialWorkflowInput, server_agents: dict[str, Agent]):
    if missing_agents := (set(step.get("agent") for step in input.steps) - server_agents.keys()):
        raise ValueError(f"The following agents are missing: {missing_agents}")

    for agent_name in (step.get("agent") for step in input.steps):
        agent = server_agents[agent_name]
        input_schema = agent.inputSchema
        required_input_properties = set(input_schema.get("required", []))

        if required_input_properties != {"text"}:
            raise ValueError(
                f"Agent '{agent_name}' has incompatible input schema. Expected {{'text': str}}, "
                f"got required properties: {required_input_properties}"
            )


def format_agent_input(instruction: str, previous_output: dict[str, Any] | str) -> str:
    if not previous_output:
        return instruction
    return f"""{
        previous_output if isinstance(previous_output, str) else yaml.dump(previous_output, allow_unicode=True)
    }\n---\n{instruction}"""


class OutputWithMetadata(Output):
    agent_name: str
    agent_idx: int


def add_sequential_workflow_agent(server: Server):
    @server.agent()
    async def run_sequential_workflow(input: SequentialWorkflowInput) -> OutputWithMetadata:
        output = Output()
        current_step = None
        try:
            async with mcp_client(url=Configuration().mcp_url) as session:
                resp = await session.list_agents()
                server_agents_by_name = {a.name: a for a in resp.agents}
                validate_agents(input, server_agents_by_name)

                previous_output = input.input

                for idx, step in enumerate(input.steps):
                    current_step = step

                    yield OutputWithMetadata(
                        agent_name=step.agent,
                        agent_idx=idx,
                        logs=[
                            Log(
                                level=LogLevel.info,
                                message=f"✅ Agent {step.agent}[{idx}] started processing",
                            ),
                        ],
                    )

                    async for message in send_request_with_notifications(
                        session,
                        req=RunAgentRequest(
                            method="agents/run",
                            params=RunAgentRequestParams(
                                name=step.agent, input={"text": format_agent_input(step.instruction, previous_output)}
                            ),
                        ),
                        result_type=RunAgentResult,
                    ):
                        match message:
                            case ServerNotification(
                                root=AgentRunProgressNotification(
                                    params=AgentRunProgressNotificationParams(delta=output_delta_dict)
                                )
                            ):
                                output_delta = OutputWithMetadata.model_validate(
                                    {**output_delta_dict, "agent_name": step.agent, "agent_idx": idx}
                                )
                                yield output_delta
                            case RunAgentResult(output=output_delta_dict):
                                output_delta = OutputWithMetadata.model_validate(
                                    {**output_delta_dict, "agent_name": step.agent, "agent_idx": idx}
                                )
                                if idx == len(input.steps) - 1:
                                    output = output_delta
                                    break

                                previous_output = getattr(
                                    output_delta, "text", output_delta.model_dump(exclude={"logs"})
                                )

                                message = (
                                    str(previous_output)[:100] + "..."
                                    if len(str(previous_output)) > 100
                                    else str(previous_output)
                                )
                                yield OutputWithMetadata(
                                    agent_name=step.agent,
                                    agent_idx=idx,
                                    logs=[
                                        Log(
                                            level=LogLevel.success,
                                            message=f"✅ Agent {step.agent}[{idx}] finished successfully: {message}",
                                        ),
                                    ],
                                )

        except Exception as e:
            step_msg = f"{current_step.agent}[{idx}] - " if current_step else ""
            raise AgentError(f"{step_msg}{extract_messages(e)}") from e
        yield output

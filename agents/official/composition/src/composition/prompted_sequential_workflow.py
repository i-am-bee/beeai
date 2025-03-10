from typing import Any

import yaml
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
from beeai_sdk.schemas.metadata import Metadata
from beeai_sdk.utils.api import send_request_with_notifications, mcp_client
from composition.configuration import Configuration
from composition.utils import extract_messages

agentName = "prompted-sequential-workflow"

exampleInput = {
    "steps": [
        {"agent": "text-summarizer", "instruction": "Summarize the following text:"},
        {"agent": "text-analyzer", "instruction": "Analyze the sentiment and key themes of this summary:"},
    ],
    "input": "Long article text here...",
}
exampleInputStr = yaml.dump(exampleInput, allow_unicode=True)

fullDescription = f"""
This agent orchestrates a sequence of text-processing AI agents, each with specific instructions. 
It manages the flow of information between agents, where each agent receives both an instruction 
and the previous agent's output formatted as YAML.

## How It Works
The agent takes a list of steps (each containing an agent name and instruction) and an initial input text. 
Each subsequent agent receives its instruction followed by the YAML-formatted output from the previous agent.

## Input Parameters
- **steps** (list) – A list of steps, each containing:
  - **agent** (str) – The name of the agent to execute
  - **instruction** (str) – The instruction for this agent
- **input** (str) – The initial input text

## Example Usage
```yaml
{exampleInputStr}
```
"""


class WorkflowStep(BaseModel):
    agent: str
    instruction: str


class PromptedSequentialWorkflowInput(Input):
    steps: list[WorkflowStep] = Field(min_length=1)
    input: str = Field(default_factory=str)

def validate_agents(input: PromptedSequentialWorkflowInput, server_agents: dict[str, Agent]):
    if missing_agents := (set(step.agent for step in input.steps) - server_agents.keys()):
        raise ValueError(f"The following agents are missing: {missing_agents}")

    for agent_name in (step.agent for step in input.steps):
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
    return f"""{instruction}\n---\n{
        previous_output if isinstance(previous_output, str) else yaml.dump(previous_output, allow_unicode=True)
    }"""


def add_prompted_sequential_workflow_agent(server: Server):
    @server.agent(
        agentName,
        "Executes a sequence of text-processing agents, each with specific instructions.",
        input=PromptedSequentialWorkflowInput,
        output=Output,
        **Metadata(
            framework=None,
            licence="Apache 2.0",
            languages=["Python"],
            githubUrl="https://github.com/i-am-bee/beeai/tree/main/agents/official/composition/src/composition/prompted_sequential_workflow.py",
            exampleInput=exampleInputStr,
            fullDescription=fullDescription,
        ).model_dump(),
        composition_agent=True,
    )
    async def run_prompted_sequential_workflow(input: PromptedSequentialWorkflowInput, ctx: Context) -> Output:
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
                                output_delta = Output.model_validate(output_delta_dict)
                                output_delta.agent_name = step.agent
                                output_delta.agent_idx = idx
                                await ctx.report_agent_run_progress(delta=output_delta)
                            case RunAgentResult(output=output_delta_dict):
                                output_delta = Output.model_validate(output_delta_dict)
                                output_delta.agent_name = step.agent
                                output_delta.agent_idx = idx
                                if idx == len(input.steps) - 1:
                                    output = output_delta
                                    break

                                previous_output = getattr(
                                    output_delta, "text", output_delta.model_dump(exclude=["logs"])
                                )

                                message = (
                                    str(previous_output)[:100] + "..."
                                    if len(str(previous_output)) > 100
                                    else str(previous_output)
                                )
                                await ctx.report_agent_run_progress(
                                    delta=Output(
                                        logs=[
                                            Log(
                                                level=LogLevel.success,
                                                message=f"✅ Agent {step.agent}[{idx}] finished successfully: {message}",
                                            ),
                                        ]
                                    )
                                )

        except Exception as e:
            step_msg = f"{current_step.agent}[{idx}] - " if current_step else ""
            raise AgentError(f"{step_msg}{extract_messages(e)}") from e
        return output

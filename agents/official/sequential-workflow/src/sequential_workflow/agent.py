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
from sequential_workflow.configuration import Configuration
from sequential_workflow.utils import extract_messages

agentName = "sequential-workflow"

exampleInput = {
    "input": "Long article text here...",
    "steps": [
        {"agent": "text-summarizer", "instruction": "Summarize the following text:"},
        {"agent": "text-analyzer", "instruction": "Analyze the sentiment and key themes of this summary:"},
    ],
}
exampleInputStr = yaml.dump(exampleInput, allow_unicode=True)

fullDescription = f"""
The sequential workflow agent is designed to manage and execute a series of text-processing tasks using multiple AI agents. It takes a series of steps, each specifying an agent and its corresponding instruction, and processes text data through these agents in a sequential manner. The agent ensures that each subsequent agent receives the output of the previous agent, formatted as YAML, along with its specific instruction, thus creating a seamless workflow for complex text-processing tasks.

## How It Works

The agent receives an initial input text and a list of steps, each comprising an agent name and its instruction. It validates the availability and compatibility of the specified agents. The workflow proceeds by passing the formatted output of each agent as input to the next, adhering to the instructions specified for each step. This process continues until all steps are executed, and the final output is generated.

## Input Parameters
- **input** (str) – The initial text input to be processed by the workflow.
- **steps** (list) – A list of steps, each containing:
  - **agent** (str) – The name of the agent to execute.
  - **instruction** (str) – The specific instruction for the agent.


## Key Features
- **Sequential Execution**: Manages the flow of data and instructions between multiple text-processing agents.
- **YAML Formatting**: Uses YAML to format outputs for seamless interoperability between agents.
- **Validation**: Ensures that each agent in the sequence is available and compatible with the expected input schema.
- **Progress Reporting**: Provides detailed logs and progress updates throughout the workflow execution.

## Use Cases
- **Complex Text Processing**: Ideal for tasks that require multiple stages of processing, such as summarization followed by sentiment analysis.
- **Automated Workflows**: Suitable for automated content processing pipelines that leverage multiple AI models.
- **Dynamic Instruction Handling**: Useful when dynamic instructions need to be provided to different agents based on prior processing results.

## Example Usage
```yaml
{exampleInputStr}
```
"""


class WorkflowStep(BaseModel):
    agent: str
    instruction: str


class SequentialWorkflowInput(Input):
    steps: list[WorkflowStep] = Field(min_length=1)
    input: str = Field(default_factory=str)


def validate_agents(input: SequentialWorkflowInput, server_agents: dict[str, Agent]):
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
    return f"""{
        previous_output if isinstance(previous_output, str) else yaml.dump(previous_output, allow_unicode=True)
    }\n---\n{instruction}"""


class OutputWithMetadata(Output):
    agent_name: str
    agent_idx: int


def add_sequential_workflow_agent(server: Server):
    @server.agent(
        agentName,
        "The agent orchestrates a sequence of text-processing AI agents, managing the flow of information and instructions between them.",
        input=SequentialWorkflowInput,
        output=Output,
        **Metadata(
            framework=None,
            licence="Apache 2.0",
            languages=["Python"],
            githubUrl="https://github.com/i-am-bee/beeai/tree/main/agents/official/composition/src/composition/sequential_workflow.py",
            exampleInput=exampleInputStr,
            fullDescription=fullDescription,
        ).model_dump(),
        composition_agent=True,
    )
    async def run_sequential_workflow(input: SequentialWorkflowInput, ctx: Context) -> OutputWithMetadata:
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

                    await ctx.report_agent_run_progress(
                        delta=OutputWithMetadata(
                            agent_name=step.agent,
                            agent_idx=idx,
                            logs=[
                                Log(
                                    level=LogLevel.info,
                                    message=f"✅ Agent {step.agent}[{idx}] started processing",
                                ),
                            ],
                        )
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
                                await ctx.report_agent_run_progress(delta=output_delta)
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
                                await ctx.report_agent_run_progress(
                                    delta=OutputWithMetadata(
                                        agent_name=step.agent,
                                        agent_idx=idx,
                                        logs=[
                                            Log(
                                                level=LogLevel.success,
                                                message=f"✅ Agent {step.agent}[{idx}] finished successfully: {message}",
                                            ),
                                        ],
                                    )
                                )

        except Exception as e:
            step_msg = f"{current_step.agent}[{idx}] - " if current_step else ""
            raise AgentError(f"{step_msg}{extract_messages(e)}") from e
        return output

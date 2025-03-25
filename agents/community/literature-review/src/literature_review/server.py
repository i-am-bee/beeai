from literature_review.configuration import load_env

load_env()

import asyncio
import json
import dataclasses

from beeai_sdk.providers.agent import run_agent_provider
from beeai_sdk.schemas.metadata import Metadata, Examples, CliExample, UiDefinition, UiType
from beeai_sdk.schemas.text import TextInput, TextOutput
from acp.server.highlevel import Server, Context
from autogen_agentchat.messages import BaseChatMessage, BaseAgentEvent
from autogen_agentchat.base import TaskResult
from literature_review.team import team
from beeai_sdk.schemas.base import Log, LogLevel

agentName = "literature-review"

examples = Examples(
    cli=[
        CliExample(
            command=(
                f"beeai run {agentName} "
                '"AI applications in healthcare, focusing on diagnostic tools and patient data management."'
            ),
            description="Conducting a Literature Review on AI in Healthcare",
            processingSteps=[
                "Initiates a round-robin task involving Google and Arxiv search agents to gather data",
                "Collects and processes search results from both sources",
                "The report agent synthesizes the data into a formatted literature review with appropriate references",
                "Outputs the literature review, ending the task with the specified termination condition",
            ],
        )
    ]
)

fullDescription = """
The agent is designed to automate the process of conducting literature reviews by gathering, analyzing, and synthesizing information from multiple sources. It uses a combination of Google searches and Arxiv database queries to fetch relevant academic papers and data, subsequently generating a well-formatted report.

## How It Works
The agent handles requests to perform literature reviews. It utilizes a set of assistant agents, including Google and Arxiv search agents, to gather information. Once the data is collected, a report agent synthesizes the information into a structured literature review, ensuring that references are correctly formatted. The process involves a round-robin communication strategy among the participating agents, with a termination condition for task completion.

## Input Parameters
- **text** (string) – Contains the text query or topic for which the literature review is to be conducted.

## Key Features
- **Automated Literature Review** – Conducts thorough searches across Google and Arxiv to gather relevant academic information.
- **Structured Report Generation** – Compiles and formats the search results into a coherent literature review with proper references.
- **Multi-Source Data Collection** – Leverages both general web searches and academic databases for comprehensive data gathering.
- **Dynamic Agent Collaboration** – Uses a round-robin approach to coordinate between search and report agents.

## Use Cases
- **Academic Research** – Supports researchers by automating the initial phase of literature review.
- **Report Generation** – Generates structured academic reports for various topics.
- **Resource Compilation** – Compiles a list of academic papers and articles relevant to a given topic.
"""


async def run():
    server = Server("autogen-agents")

    @server.agent(
        agentName,
        "This agent automates deep web research by generating queries, gathering relevant sources, summarizing key information, and iterating on knowledge gaps to refine the results.",
        input=TextInput,
        output=TextOutput,
        **Metadata(
            framework="AutoGen",
            license="CC-BY-4.0, MIT",
            languages=["Python"],
            githubUrl="https://github.com/i-am-bee/beeai/tree/main/agents/community/autogen-agents/src/autogen_agents/literature_review",
            examples=examples,
            ui=UiDefinition(type=UiType.hands_off, userGreeting="What topic do you want to research?"),
            fullDescription=fullDescription,
        ).model_dump(),
    )
    async def run_literature_review(input: TextInput, ctx: Context) -> TextOutput:
        def encode_value(value):
            if dataclasses.is_dataclass(value):
                return dataclasses.asdict(value)
            return value

        def serialize_json(value):
            try:
                return json.dumps(value, indent=2, default=encode_value)
            except:
                return ""

        try:
            async for value in team.run_stream(
                task=input.text,
            ):
                if isinstance(value, BaseChatMessage) or isinstance(value, BaseAgentEvent):
                    action = {
                        "content": value.content,
                        "type": value.type,
                        "source": value.source,
                    }
                    delta = TextOutput(
                        text="",
                        logs=[
                            None,
                            Log(
                                message=serialize_json(action),
                                **action,
                            ),
                        ],
                    )
                    await ctx.report_agent_run_progress(delta)
                if isinstance(value, TaskResult):
                    content = value.messages[-1].content
                    return TextOutput(
                        text=content,
                        stop_reason=value.stop_reason,
                        level=LogLevel.success,
                    )

            return TextOutput(text="")

        except Exception as e:
            raise Exception(f"An error occurred while running the agent: {e}")

    await run_agent_provider(server)


def main():
    asyncio.run(run())

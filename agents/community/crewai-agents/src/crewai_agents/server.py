import asyncio
import json

from beeai_sdk.providers.agent import run_agent_provider
from beeai_sdk.schemas.base import Log, LogLevel
from beeai_sdk.schemas.metadata import Metadata, Examples, CliExample, UiDefinition, UiType
from crewai.crew import CrewOutput
from crewai.agents.parser import AgentAction, AgentFinish
from acp.server.highlevel import Server, Context

from crewai_agents.configuration import load_env
from crewai_agents.marketing_strategy.crew import MarketingPostsCrew

from beeai_sdk.schemas.text import TextInput, TextOutput

load_env()

agentName = "marketing-strategy"

examples = Examples(
    cli=[
        CliExample(
            command=(
                f"beeai run {agentName} "
                '"Launch of a new eco-friendly product line targeting young adults interested in sustainable living."'
            ),
            description="Generating a Marketing Strategy for a New Product",
            processingSteps=[
                "The Lead Market Analyst conducts research on the product and its competitors",
                "The Chief Marketing Strategist synthesizes insights to formulate a marketing strategy",
                "The Creative Content Creator develops campaign ideas and creates marketing copies",
            ],
        )
    ]
)

fullDescription = """
The agent conducts in-depth marketing strategy analysis for projects by leveraging a coordinated crew of agents with specific roles. It breaks down the process into sequential tasks, each handled by specialized agents such as the Lead Market Analyst, Chief Marketing Strategist, and Creative Content Creator. This approach ensures that the final output is a well-rounded and actionable marketing strategy tailored to the project's needs.

## How It Works
The agent initializes a server where it registers a "marketing-strategy" agent, which analyzes projects by executing a series of tasks. Each task is managed by a specific agent, with their outputs feeding into subsequent tasks. The Lead Market Analyst conducts initial research, the Chief Marketing Strategist formulates strategies, and the Creative Content Creator develops campaign ideas and marketing copies. The process is executed asynchronously to enhance performance and efficiency.

## Input Parameters
- **text** (string) – A text which describes the project for which the marketing strategy is to be developed.

## Key Features
- **Multi-Agent Coordination** – Utilizes multiple specialized agents to perform distinct tasks in the marketing strategy process.
- **Sequential Task Execution** – The agents execute tasks in a predefined order to ensure comprehensive strategy formulation.
- **Asynchronous Processing** – Enhances efficiency by running tasks asynchronously within the framework.

## Use Cases
- **Marketing Strategy Development** – Ideal for businesses needing a comprehensive marketing plan for new projects or campaigns.
- **Campaign Ideation** – Generates innovative and engaging campaign ideas aligned with marketing strategies.
- **Copy Creation** – Develops compelling marketing copies tailored to specific campaign ideas and target audiences.
"""


async def run():
    server = Server("crewai-agents")

    @server.agent(
        agentName,
        "The agent performs comprehensive marketing strategy analysis for projects, generating detailed strategies, campaign ideas, and compelling marketing copies through a structured process involving multiple expert roles.",
        input=TextInput,
        output=TextOutput,
        **Metadata(
            framework="CrewAI",
            license="Apache 2.0",
            languages=["Python"],
            githubUrl="https://github.com/i-am-bee/beeai/tree/main/agents/community/crewai-agents/src/crewai_agents/marketing_strategy",
            ui=UiDefinition(type=UiType.single_prompt, userGreeting="Describe a project or a product to analyze."),
            examples=examples,
            fullDescription=fullDescription,
        ).model_dump(),
    )
    async def run_marketing_crew(input: TextInput, ctx: Context) -> TextOutput:
        loop = asyncio.get_event_loop()

        def step_callback(data, *args, **kwargs):
            delta = None

            if isinstance(data, AgentAction):
                action = {
                    "thought": data.thought,
                    "tool": data.tool,
                    "tool_input": data.tool_input,
                    "result": data.result,
                }
                delta = TextOutput(
                    text="",
                    logs=[None, Log(message=json.dumps(action, indent=2), **action)],
                )
            elif isinstance(data, AgentFinish):
                delta = TextOutput(text=data.output, logs=[None, Log(message=data.text, level=LogLevel.success)])
            if delta:
                asyncio.run_coroutine_threadsafe(ctx.report_agent_run_progress(delta=delta), loop)

        try:
            crew = MarketingPostsCrew().crew(step_callback=step_callback)
            inputs = {"project_description": input.text}
            result: CrewOutput = await asyncio.to_thread(crew.kickoff, inputs=inputs)
            return TextOutput(text=result.raw)
        except Exception as e:
            raise Exception(f"An error occurred while running the crew: {e}")

    await run_agent_provider(server)


def main():
    asyncio.run(run())

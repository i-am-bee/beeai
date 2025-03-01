import asyncio
from typing import Any

from gpt_researcher import GPTResearcher

from acp.server.highlevel import Server
from beeai_sdk.providers.agent import run_agent_provider
from beeai_sdk.schemas.base import Log
from beeai_sdk.schemas.metadata import Metadata
from beeai_sdk.schemas.text import TextInput, TextOutput
from gpt_researcher_agent.configuration import load_env

load_env()  # GPT Researchers uses env variables for configuration

agentName = "gpt-researcher"

exampleInputText = "Impact of climate change on global agriculture"

fullDescription = f"""
The agent is an autonomous system designed to perform detailed research on any specified topic, leveraging both web and local resources. It generates a long, factual report complete with citations, striving to provide unbiased and accurate information. Drawing inspiration from recent advancements in AI-driven research methodologies, the agent addresses common challenges like misinformation and the limits of traditional LLMs, offering robust performance through parallel processing.

## How It Works
The GPT Researcher agent operates by deploying a 'planner' to generate relevant research questions and 'execution' agents to collect information. The system then aggregates these findings into a well-structured report. This approach minimizes biases by cross-referencing multiple sources and focuses on delivering comprehensive insights. It employs a custom infrastructure to ensure rapid and deterministic outcomes, making it suitable for diverse research applications.

## Input Parameters
- **text** (string) – The topic or query for which the research report is to be generated.

## Key Features
- **Comprehensive Research** – Generates detailed reports using information from multiple sources.
- **Bias Reduction** – Cross-references data from various platforms to minimize misinformation and bias.
- **High Performance** – Utilizes parallelized processes for efficient and swift report generation.
- **Customizable** – Offers customization options to tailor research for specific domains or tasks.

## Use Cases
- **Comprehensive Research** – Generates detailed reports using information from multiple sources.
- **Bias Reduction** – Cross-references data from various platforms to minimize misinformation and bias.
- **High Performance** – Utilizes parallelized processes for efficient and swift report generation.
- **Customizable** – Offers customization options to tailor research for specific domains or tasks.

## Example Usage

### Example: Conducting Research on Climate Change

#### CLI:
```bash
beeai run {agentName} "{exampleInputText}"
```

#### Processing Steps:
1. Initializes task-specific agents to interpret the query.
2. Generates a series of questions to form an objective opinion on the topic.
3. Uses a crawler agent to gather and summarize information for each question.
4. Aggregates and filters these summaries into a final comprehensive report.
"""

async def register_agent() -> int:
    server = Server("researcher-agent")

    @server.agent(
        agentName,
        "The agent conducts in-depth local and web research using a language model to generate comprehensive reports with citations, aimed at delivering factual, unbiased information.",
        input=TextInput,
        output=TextOutput,
        **Metadata(
            framework="Custom",
            license="Apache 2.0",
            languages=["Python"],
            githubUrl="https://github.com/i-am-bee/beeai/tree/main/agents/community/gpt-researcher-agent/gpt_researcher_agent",
            avgRunTimeSeconds=2.1,
            avgRunTokens=111,
            exampleInput=exampleInputText,
            fullDescription=fullDescription,
        ).model_dump(),
    )
    async def run_agent(input: TextInput, ctx) -> TextOutput:
        output: TextOutput = TextOutput(text="")

        class CustomLogsHandler:
            async def send_json(self, data: dict[str, Any]) -> None:
                match data.get("type"):
                    case "logs":
                        log = Log(
                            message=f"[{data.get('content', 'log')}] {data.get('output')}",
                            metadata=data.get("metadata", None),
                        )
                        output.logs.append(log)
                        await ctx.report_agent_run_progress(TextOutput(logs=[None, log], text=""))
                    case "report":
                        output.text += data.get("output", "")
                        await ctx.report_agent_run_progress(TextOutput(text=data.get("output", "")))

        researcher = GPTResearcher(query=input.text, report_type="research_report", websocket=CustomLogsHandler())
        # Conduct research on the given query
        await researcher.conduct_research()
        # Write the report
        await researcher.write_report()
        return output

    await run_agent_provider(server)

    return 0


def main():
    asyncio.run(register_agent())

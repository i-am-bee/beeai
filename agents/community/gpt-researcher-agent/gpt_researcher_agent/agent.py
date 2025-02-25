import asyncio
from typing import Any

from acp.server.highlevel import Server
from beeai_sdk.providers.agent import run_agent_provider
from beeai_sdk.schemas.base import TextInput, TextOutput, Log
from beeai_sdk.schemas.metadata import Metadata
from gpt_researcher_agent.configuration import load_env

load_env()  # GPT Researchers uses env variables for configuration


async def register_agent() -> int:
    server = Server("researcher-agent")

    @server.agent(
        "gpt-researcher",
        "LLM based autonomous agent that conducts deep local and web research on any topic and generates a long report with citations.",
        input=TextInput,
        output=TextOutput,
        **Metadata(
            framework="Custom",
            license="Apache 2.0",
            languages=["Python"],
            githubUrl="https://github.com/i-am-bee/beeai/tree/main/agents/community/gpt-researcher-agent/gpt_researcher_agent",
            avgRunTimeSeconds=2.1,
            avgRunTokens=111,
            fullDescription="""
GPT Researcher is an autonomous agent designed for comprehensive web and local research on any given task.

The agent produces detailed, factual, and unbiased research reports with citations. GPT Researcher provides a full suite of customization options to create tailor made and domain specific research agents. Inspired by the recent Plan-and-Solve and RAG papers, GPT Researcher addresses misinformation, speed, determinism, and reliability by offering stable performance and increased speed through parallelized agent work.

Our mission is to empower individuals and organizations with accurate, unbiased, and factual information through AI.

## Why GPT Researcher?

- Objective conclusions for manual research can take weeks, requiring vast resources and time.
- LLMs trained on outdated information can hallucinate, becoming irrelevant for current research tasks.
- Current LLMs have token limitations, insufficient for generating long research reports.
- Limited web sources in existing services lead to misinformation and shallow results.
- Selective web sources can introduce bias into research tasks.

## Architecture

The core idea is to utilize 'planner' and 'execution' agents. The planner generates research questions, while the execution agents gather relevant information. The publisher then aggregates all findings into a comprehensive report.

Steps:
- Create a task-specific agent based on a research query.
- Generate questions that collectively form an objective opinion on the task.
- Use a crawler agent for gathering information for each question.
- Summarize and source-track each resource.
- Filter and aggregate summaries into a final research report.

## Disclaimer

This project, GPT Researcher, is an experimental application and is provided "as-is" without any warranty, express or implied. We are sharing codes for academic purposes under the Apache 2 license. Nothing herein is academic advice, and NOT a recommendation to use in academic or research papers.
Our view on unbiased research claims:
1. The main goal of GPT Researcher is to reduce incorrect and biased facts. How? We assume that the more sites we scrape the less chances of incorrect data. By scraping multiple sites per research, and choosing the most frequent information, the chances that they are all wrong is extremely low.
2. We do not aim to eliminate biases; we aim to reduce it as much as possible. We are here as a community to figure out the most effective human/llm interactions.
3. In research, people also tend towards biases as most have already opinions on the topics they research about. This tool scrapes many opinions and will evenly explain diverse views that a biased person would never have read.
""",
        ).model_dump(),
    )
    async def run_agent(input: TextOutput, ctx) -> TextOutput:
        output: TextOutput = TextOutput(text="")

        class CustomLogsHandler:
            async def send_json(self, data: dict[str, Any]) -> None:
                match data.get("type"):
                    case "logs":
                        log = Log(
                            message=f"[{data.get('content', 'log')}] {data.get('output')}", **data.get("metadata", {})
                        )
                        output.logs.append(log)
                        await ctx.report_agent_run_progress(TextOutput(logs=[None, log], text=""))
                    case "report":
                        output.text += data.get("output", "")
                        await ctx.report_agent_run_progress(TextOutput(text=data.get("output", "")))

        researcher = GPTResearcher(query=input.prompt, report_type="research_report", websocket=CustomLogsHandler())
        # Conduct research on the given query
        await researcher.conduct_research()
        # Write the report
        await researcher.write_report()
        return output

    await run_agent_provider(server)

    return 0


def main():
    asyncio.run(register_agent())

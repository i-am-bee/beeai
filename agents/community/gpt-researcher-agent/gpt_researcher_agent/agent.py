from typing import Any
import asyncio
from gpt_researcher import GPTResearcher
from mcp.server.fastmcp import FastMCP
from beeai_sdk.schemas.prompt import PromptInput, PromptOutput
from beeai_sdk.providers.agent import run_agent_provider
from beeai_sdk.schemas.metadata import Metadata

from gpt_researcher_agent.configuration import load_env

load_env()  # GPT Researchers uses env variables for configuration


class Output(PromptOutput):
    type: None | str = None
    content: None | str = None
    text: None | str = None
    metadata: None | Any = None


class CustomLogsHandler:
    def __init__(self, send_progress):
        self.send_progress = send_progress

    async def send_json(self, data: dict[str, Any]) -> None:
        delta = Output(
            type=data.get("type"), content=data.get("content"), text=data.get("output"), metadata=data.get("metadata")
        )
        await self.send_progress(delta)


async def register_agent() -> int:
    server = FastMCP("researcher-agent")

    @server.agent(
        "GPT-researcher",
        "LLM based autonomous agent that conducts deep local and web research on any topic and generates a long report with citations.",
        input=PromptInput,
        output=Output,
        **Metadata(
            title="GPT Researcher",
            framework="GPT researcher",
            licence="Apache 2.0",
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
    async def run_agent(input: PromptInput, ctx) -> Output:
        async def send_progress(delta: Output):
            await ctx.report_agent_run_progress(delta)

        custom_logs_handler = CustomLogsHandler(send_progress)

        researcher = GPTResearcher(query=input.prompt, report_type="research_report", websocket=custom_logs_handler)
        # Conduct research on the given query
        await researcher.conduct_research()
        # Write the report
        report = await researcher.write_report()
        return Output(type="result", text=report)

    await run_agent_provider(server)

    return 0


def main():
    asyncio.run(register_agent())

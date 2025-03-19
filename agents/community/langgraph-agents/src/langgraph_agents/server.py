import asyncio

from openinference.instrumentation.langchain import LangChainInstrumentor
from acp.server.highlevel import Context, Server
from beeai_sdk.providers.agent import run_agent_provider
from beeai_sdk.schemas.metadata import Metadata, Examples, CliExample, UiDefinition, UiType
from beeai_sdk.schemas.text import TextOutput, TextInput
from beeai_sdk.schemas.base import Log

from langgraph_agents.configuration import load_env
from langgraph_agents.ollama_deep_researcher.graph import graph
from langgraph_agents.ollama_deep_researcher.state import SummaryStateInput

LangChainInstrumentor().instrument()
load_env()

agentName = "ollama-deep-researcher"

examples = Examples(
    cli=[
        CliExample(
            command=f'beeai run {agentName} "Advancements in quantum computing"',
            description="Running a Research Query",
            processingSteps=[
                'Generates a query: "Recent breakthroughs in quantum computing hardware"',
                "Searches the web using Tavily",
                "Summarizes retrieved data",
                'Reflects on missing insights, generating a follow-up query: "How do quantum error correction techniques improve stability?"',
                "Repeats the search-summarization cycle until the iteration limit is reached",
                "Outputs a structured summary with cited sources",
            ],
        )
    ]
)

fullDescription = """
This agent automates deep web research by generating queries, gathering relevant sources, summarizing key information, and iterating on knowledge gaps to refine the results. It enables structured, efficient research through a configurable workflow.

## How It Works
The agent follows a structured workflow to perform iterative web research and summarization:

- **Query Generation**: Uses an LLM to generate a precise search query based on the given research topic.
- **Web Research**: Searches the web using different APIs (Tavily, Perplexity, DuckDuckGo) to retrieve relevant sources.
- **Summarization**: Extracts key insights from search results and integrates them into an evolving summary.
- **Reflection & Iteration**: Identifies knowledge gaps and generates follow-up queries for deeper research.
- **Finalization**: Consolidates all gathered insights and sources into a structured summary.

The agent loops through steps 2–4 until the research loop limit is reached.

## Input Parameters
- **prompt** (string) – The topic to research.

## Key Features
- **Iterative Research Process** – Automatically refines queries and expands knowledge.
- **Multi-Source Information Gathering** – Supports Tavily, DuckDuckGo, and Perplexity APIs.
- **LLM-Powered Summarization** – Generates coherent and well-structured summaries.
- **Automated Query Refinement** – Identifies knowledge gaps and adjusts queries dynamically.

## Use Cases
- **Market Research** – Automates data gathering for competitive analysis.
- **Academic Research** – Summarizes recent findings on a specific topic.
- **Content Creation** – Gathers background information for articles, blogs, and reports.
- **Technical Deep Dives** – Explores emerging technologies with structured, iterative research.
"""


async def run():
    server = Server("langgraph-agents")

    @server.agent(
        agentName,
        "The agent performs AI-driven research by generating queries, gathering web data, summarizing findings, and refining results through iterative knowledge gap analysis.",
        input=TextInput,
        output=TextOutput,
        **Metadata(
            framework="LangGraph",
            license="Apache 2.0",
            languages=["Python"],
            githubUrl="https://github.com/i-am-bee/beeai/tree/main/agents/community/langgraph-agents/src/langgraph_agents/ollama_deep_researcher",
            examples=examples,
            ui=UiDefinition(type=UiType.hands_off, userGreeting="What topic do you want to research?"),
            fullDescription=fullDescription,
        ).model_dump(),
    )
    async def run_deep_researcher_graph(input: TextInput, ctx: Context) -> TextOutput:
        loop = asyncio.get_event_loop()
        inputs = SummaryStateInput(research_topic=input.text)
        try:
            output = None
            async for event in graph.astream(inputs, stream_mode="updates"):
                logs = [
                    Log(
                        message=f"🚶‍♂️{key}: {str(value)[:100] + '...' if len(str(value)) > 100 else str(value)}",
                        **{key: value},
                    )
                    for key, value in event.items()
                ]
                output = event
                await ctx.report_agent_run_progress(delta=TextOutput(logs=[None, *logs], text=""))
            output = output.get("finalize_summary", {}).get("running_summary", None)
            return TextOutput(text=str(output))
        except Exception as e:
            raise Exception(f"An error occurred while running the graph: {e}")

    await run_agent_provider(server)


def main():
    asyncio.run(run())

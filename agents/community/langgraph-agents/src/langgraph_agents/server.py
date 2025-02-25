import asyncio
from typing import Any
import json

from acp.server.highlevel import Context, Server
from beeai_sdk.providers.agent import run_agent_provider
from beeai_sdk.schemas.metadata import Metadata
from beeai_sdk.schemas.prompt import PromptInput, PromptOutput
from pydantic import Field, BaseModel

from langgraph_agents.configuration import load_env
from langgraph_agents.ollama_deep_researcher.graph import graph
from langgraph_agents.ollama_deep_researcher.state import SummaryStateInput

load_env()


class Log(BaseModel):
    content: str
    text: str
    metadata: Any = Field(default=None)


class Output(PromptOutput):
    logs: list[Log | None] = Field(default_factory=list)
    text: str = Field(default_factory=str)


exampleInput = {
    "prompt": "Advancements in quantum computing"
}

exampleOutput = {
    "text": "## Summary\n\nMicrosoft's advancements in quantum computing have led to the development of..."
}

# Convert JSON to a properly escaped string
exampleInputStr = json.dumps(exampleInput, ensure_ascii=False, indent=2)
exampleOutputStr = json.dumps(exampleOutput, ensure_ascii=False, indent=2)

fullDescription = f"""
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

## Example Usage

### Example 1: Running a Research Query

#### Input:
```json
{exampleInputStr}
```

#### CLI:
```bash
beeai run ollama-deep-researcher '{exampleInputStr}'
```

#### Processing Steps:

1. Generates a query: "Recent breakthroughs in quantum computing hardware"
2. Searches the web using Tavily.
3. Summarizes retrieved data.
4. Reflects on missing insights, generating a follow-up query: "How do quantum error correction techniques improve stability?"
5. Repeats the search-summarization cycle until the iteration limit is reached.
6. Outputs a structured summary with cited sources.

### Output:

```json
{exampleOutputStr}
```
"""

async def run():
    server = Server("langgraph-agents")

    @server.agent(
        "ollama-deep-researcher",
        "The agent performs AI-driven research by generating queries, gathering web data, summarizing findings, and refining results through iterative knowledge gap analysis.",
        input=PromptInput,
        output=PromptOutput,
        **Metadata(
            framework="LangGraph",
            license="Apache 2.0",
            languages=["Python"],
            githubUrl="https://github.com/i-am-bee/beeai/tree/main/agents/community/langgraph-agents/src/langgraph_agents/ollama_deep_researcher",
            exampleInput=exampleInput,
            fullDescription=fullDescription
        ).model_dump(),
    )
    async def run_deep_researcher_graph(input: PromptInput, ctx: Context) -> PromptOutput:
        loop = asyncio.get_event_loop()
        inputs = SummaryStateInput(research_topic=input.prompt)
        try:
            output = None
            async for event in graph.astream(inputs, stream_mode="updates"):
                logs = [
                    Log(
                        text=f"🚶‍♂️{key}: {str(value)[:100] + '...' if len(str(value)) > 100 else str(value)}",
                        content=str({key: value}),
                    )
                    for key, value in event.items()
                ]
                output = event
                await ctx.report_agent_run_progress(delta=Output(logs=[None, *logs]))
            output = output.get("finalize_summary", {}).get("running_summary", None)
            return PromptOutput(text=str(output))
        except Exception as e:
            raise Exception(f"An error occurred while running the graph: {e}")

    await run_agent_provider(server)


def main():
    asyncio.run(run())

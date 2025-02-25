import asyncio
from typing import Any


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


async def run():
    server = Server("langgraph-agents")

    @server.agent(
        "ollama-deep-researcher",
        "TBD",
        input=PromptInput,
        output=PromptOutput,
        **Metadata(
            framework="LangGraph",
            license="Apache 2.0",
            languages=["Python"],
            githubUrl="https://github.com/i-am-bee/beeai/tree/main/agents/community/langgraph-agents/src/langgraph_agents/ollama_deep_researcher"
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

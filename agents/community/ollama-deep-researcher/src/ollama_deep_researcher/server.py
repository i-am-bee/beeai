from typing import AsyncGenerator
from openinference.instrumentation.langchain import LangChainInstrumentor
from beeai_sdk.providers.agent import Server
from beeai_sdk.schemas.text import TextOutput, TextInput
from beeai_sdk.schemas.base import Log

from ollama_deep_researcher.graph import graph
from ollama_deep_researcher.state import SummaryStateInput

LangChainInstrumentor().instrument()

server = Server("langgraph-agents")


@server.agent()
async def run_deep_researcher_graph(input: TextInput) -> AsyncGenerator[TextOutput, None]:
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
            yield TextOutput(logs=[None, *logs], text="")
        output = output.get("finalize_summary", {}).get("running_summary", None)
        yield TextOutput(text=str(output))
    except Exception as e:
        raise Exception(f"An error occurred while running the graph: {e}")

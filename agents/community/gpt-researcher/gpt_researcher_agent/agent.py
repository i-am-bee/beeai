from typing import Any

from gpt_researcher import GPTResearcher
from openinference.instrumentation.openai import OpenAIInstrumentor

from beeai_sdk.providers.agent import Server, Context
from beeai_sdk.schemas.base import Log
from beeai_sdk.schemas.text import TextInput, TextOutput
from gpt_researcher_agent.configuration import load_env

OpenAIInstrumentor().instrument()
load_env()  # GPT Researchers uses env variables for configuration

server = Server("researcher-agent")


@server.agent()
async def run_agent(input: TextInput, ctx: Context) -> TextOutput:
    output: TextOutput = TextOutput(text="")

    class CustomLogsHandler:
        async def send_json(self, data: dict[str, Any]) -> None:
            match data.get("type"):
                case "logs":
                    log = Log(
                        message=data.get("output", ""),
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

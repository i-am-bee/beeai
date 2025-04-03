import json

from openinference.instrumentation.crewai import CrewAIInstrumentor
from openinference.instrumentation.langchain import LangChainInstrumentor
from beeai_sdk.providers.agent import Server, Context
from beeai_sdk.schemas.base import Log, LogLevel
from crewai.agents.parser import AgentAction, AgentFinish

from marketing_strategy.configuration import load_env
from marketing_strategy.crew import MarketingPostsCrew

from beeai_sdk.schemas.text import TextInput, TextOutput

CrewAIInstrumentor().instrument()
LangChainInstrumentor().instrument()
load_env()

server = Server("crewai-agents")


@server.agent()
def run_marketing_crew(input: TextInput, ctx: Context) -> TextOutput:
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
            ctx.report_agent_run_progress(delta=delta)

    try:
        inputs = {"project_description": input.text}
        result = MarketingPostsCrew().crew(step_callback=step_callback).kickoff(inputs=inputs)
        return TextOutput(text=result.raw)
    except Exception as e:
        raise Exception(f"An error occurred while running the crew: {e}")

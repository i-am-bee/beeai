import asyncio
import json

from beeai_sdk.providers.agent import run_agent_provider
from beeai_sdk.schemas.base import Log, LogLevel
from beeai_sdk.schemas.metadata import Metadata
from crewai.crew import CrewOutput
from crewai.agents.parser import AgentAction, AgentFinish
from acp.server.highlevel import Server, Context

from crewai_agents.configuration import load_env
from crewai_agents.marketing_strategy.crew import MarketingPostsCrew

from beeai_sdk.schemas.prompt import PromptInput, PromptOutput

load_env()


async def run():
    server = Server("crewai-agents")

    @server.agent(
        "marketing-strategy",
        "Performs marketing strategy analysis over a project",
        input=PromptInput,
        output=PromptOutput,
        **Metadata(
            framework="CrewAI",
            license="Apache 2.0",
            languages=["Python"],
            githubUrl="https://github.com/i-am-bee/beeai/tree/main/agents/community/crewai-agents/src/crewai_agents/marketing_strategy",
        ).model_dump(),
    )
    async def run_marketing_crew(input: PromptInput, ctx: Context) -> PromptOutput:
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
                delta = PromptOutput(
                    text="",
                    logs=[None, Log(message=json.dumps(action, indent=2), **action)],
                )
            elif isinstance(data, AgentFinish):
                delta = PromptOutput(text=data.output, logs=[None, Log(message=data.text, level=LogLevel.success)])
            if delta:
                asyncio.run_coroutine_threadsafe(ctx.report_agent_run_progress(delta=delta), loop)

        try:
            crew = MarketingPostsCrew().crew(step_callback=step_callback)
            inputs = {"project_description": input.text}
            result: CrewOutput = await asyncio.to_thread(crew.kickoff, inputs=inputs)
            return PromptOutput(text=result.raw)
        except Exception as e:
            raise Exception(f"An error occurred while running the crew: {e}")

    await run_agent_provider(server)


def main():
    asyncio.run(run())

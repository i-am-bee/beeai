from autogen_agents.configuration import load_env

load_env()

import asyncio
import json
import dataclasses

from beeai_sdk.providers.agent import run_agent_provider
from beeai_sdk.schemas.metadata import Metadata
from beeai_sdk.schemas.prompt import PromptInput, PromptOutput
from acp.server.highlevel import Server, Context
from autogen_agentchat.messages import BaseChatMessage, BaseAgentEvent
from autogen_agentchat.base import TaskResult
from autogen_agents.literature_review.team import team
from beeai_sdk.schemas.base import Log, LogLevel

async def run():
    server = Server("autogen-agents")

    @server.agent(
        "literature-review",
        "Agent that conducts a literature review",
        input=PromptInput,
        output=PromptOutput,
        **Metadata(
            framework="Autogen",
            license="CC-BY-4.0, MIT",
            languages=["Python"],
            githubUrl="https://github.com/i-am-bee/beeai/tree/main/agents/community/autogen-agents/src/autogen_agents/literature_review",
        ).model_dump(),
    )
    async def run_literature_review(input: PromptInput, ctx: Context) -> PromptOutput:
        def encode_value(value):
            if dataclasses.is_dataclass(value):
                return dataclasses.asdict(value)
            return value

        def serialize_json(value):
            try:
                return json.dumps(value, indent=2, default=encode_value)
            except:
                return ""

        try:
            async for value in team.run_stream(
                task=input.text,
            ):
                if isinstance(value, BaseChatMessage) or isinstance(
                    value, BaseAgentEvent
                ):
                    action = {
                        "content": value.content,
                        "type": value.type,
                        "source": value.source,
                    }
                    delta = PromptOutput(
                        text="",
                        logs=[
                            None,
                            Log(
                                message=serialize_json(action),
                                **action,
                            ),
                        ],
                    )
                    await ctx.report_agent_run_progress(delta)
                if isinstance(value, TaskResult):
                    content = value.messages[-1].content
                    return PromptOutput(
                        text=content,
                        stop_reason=value.stop_reason,
                        level=LogLevel.success,
                    )

            return PromptOutput(text="")

        except Exception as e:
            raise Exception(f"An error occurred while running the agent: {e}")

    await run_agent_provider(server)


def main():
    asyncio.run(run())

import asyncio
from typing import Any

from pydantic import BaseModel, Field
from beeai_sdk.providers.agent import run_agent_provider
from beeai_sdk.schemas.metadata import Metadata
from beeai_sdk.schemas.prompt import PromptInput, PromptOutput
from acp.server.highlevel import Server, Context
from autogen_agentchat.messages import (
    BaseMessage,
    TextMessage,
    StopMessage,
    ToolCallSummaryMessage,
    HandoffMessage,
    ToolCallRequestEvent,
    ToolCallExecutionEvent,
    MemoryQueryEvent,
    UserInputRequestedEvent,
    ModelClientStreamingChunkEvent,
)
from autogen_agentchat.base import TaskResult
from autogen_agents.literature_review.literature import team

# from autogen_agents.configuration import load_env


# load_env()


class Log(BaseModel):
    content: str


class Output(PromptOutput):
    logs: list[Log | None] = Field(default_factory=list)
    text: str = Field(default_factory=str)
    stop_reason: str | None = None


async def run():
    server = Server("autogen-agents")
    output: Output = Output()

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
        try:
            async for value in team.run_stream(
                task=input.prompt,
            ):
                # print("tttttttttt ", type(value))
                # print("vvvvvvvvvv ", type(value.content))
                if (
                    isinstance(value, TextMessage)
                    or isinstance(value, StopMessage)
                    or isinstance(value, ToolCallSummaryMessage)
                    or isinstance(value, HandoffMessage)
                ):
                    log = Log(content=value.content)
                    output.logs.append(log)
                    print('sssssssssending data')
                    await ctx.report_agent_run_progress(Output(logs=[None, log]))
                # TODO MultiModalMessage
                if isinstance(value, UserInputRequestedEvent) or isinstance(
                    value, ModelClientStreamingChunkEvent
                ):
                    log = Log(content=value.content)
                    output.logs.append(log)
                    print('sssssssssending data')
                    await ctx.report_agent_run_progress(Output(logs=[None, log]))
                if (
                    # isinstance(value, ToolCallRequestEvent)
                    isinstance(value, ToolCallExecutionEvent)
                    # or isinstance(value, MemoryQueryEvent)
                ):
                    output.logs.append(
                        Log(content=item.content) for item in value.content
                    )
                    print('sssssssssending data')
                    await ctx.report_agent_run_progress(Output(logs=[None, log]))
                if isinstance(value, TaskResult):
                    content = value.messages[-1].content
                    output.text += content
                    print('sssssssssending result')
                    await ctx.report_agent_run_progress(
                        Output(text=content, stop_reason=value.stop_reason)
                    )

            # return PromptOutput(text=text)
        except Exception as e:
            raise Exception(f"An error occurred while running the agent: {e}")

    # await run_literature_review(PromptInput(prompt='Hello'), {})

    await run_agent_provider(server)


def main():
    asyncio.run(run())

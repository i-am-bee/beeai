from typing import Generator
from literature_review.configuration import load_env

load_env()

import json
import dataclasses

from beeai_sdk.schemas.text import TextInput, TextOutput
from beeai_sdk.providers.agent import Server
from autogen_agentchat.messages import BaseChatMessage, BaseAgentEvent
from autogen_agentchat.base import TaskResult
from literature_review.team import team
from beeai_sdk.schemas.base import Log, LogLevel

server = Server("autogen-agents")


@server.agent()
async def run_literature_review(input: TextInput):
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
            if isinstance(value, BaseChatMessage) or isinstance(value, BaseAgentEvent):
                action = {
                    "content": value.content,
                    "type": value.type,
                    "source": value.source,
                }
                delta = TextOutput(
                    text="",
                    logs=[
                        None,
                        Log(
                            message=serialize_json(action),
                            **action,
                        ),
                    ],
                )
                yield delta
            if isinstance(value, TaskResult):
                content = value.messages[-1].content
                yield TextOutput(
                    text=content,
                    stop_reason=value.stop_reason,
                    level=LogLevel.success,
                )

        yield TextOutput(text="")

    except Exception as e:
        raise Exception(f"An error occurred while running the agent: {e}")

import asyncio
from acp_sdk.server.agent import Agent
from acp_sdk.models import Message, Run, AwaitResume


class RunBundle:
    def __init__(self, *, agent: Agent, run: Run, task: asyncio.Task | None = None):
        self.agent = agent
        self.run = run
        self.task = task

        self.stream_queue: asyncio.Queue[Message] = asyncio.Queue()
        self.composed_message = Message()

        self.await_queue: asyncio.Queue[AwaitResume] = asyncio.Queue(maxsize=1)
        self.await_or_terminate_event = asyncio.Event()

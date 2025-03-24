import asyncio
from acp_sdk.server.agent import Agent
from acp_sdk.models import Run, RunAwait, RunAwaitResume, RunStream


class RunBundle:
    def __init__(self, *, agent: Agent, run: Run, task: asyncio.Task | None = None):
        self.agent = agent
        self.run = run
        self.task = task

        self.stream_output_queue: asyncio.Queue[RunStream] = asyncio.Queue()

        self.await_queue: asyncio.Queue[RunAwait] = asyncio.Queue()
        self.await_resume_queue: asyncio.Queue[RunAwaitResume] = asyncio.Queue()

from contextlib import asynccontextmanager
import asyncio

import aiohttp
import aiohttp_sse_client.client

from acp_sdk.schemas import Config, Input
from acp_sdk.server import RunCreateBody, Run


class AgentClient:
    def __init__(self, session: aiohttp.ClientSession):
        self._session = session

    async def run(self, input: Input):
        async with self._session.post(
            "/runs", json=RunCreateBody(config=Config(), input=input).model_dump()
        ) as resp:
            run = Run.model_validate(await resp.json())
            while not run.output:
                await asyncio.sleep(1)
                async with self._session.get(
                    f"/runs/{run.id}",
                    json=RunCreateBody(config=Config(), input=input).model_dump(),
                ) as resp:
                    run = Run.model_validate(await resp.json())
            return run.output

    async def run_stream(self, input: Input):
        async with aiohttp_sse_client.client.EventSource(
            "/runs",
            session=self._session,
            option={"method": "POST"},
            json=RunCreateBody(config=Config(), input=input, stream=True).model_dump(),
        ) as event_source:
            async for event in event_source:
                if event.type == "end":
                    await event_source.close()
                    break
                else:
                    yield Run.model_validate_json(event.data).output


@asynccontextmanager
async def create_client(url: str):
    async with aiohttp.ClientSession(url) as session:
        yield AgentClient(session)

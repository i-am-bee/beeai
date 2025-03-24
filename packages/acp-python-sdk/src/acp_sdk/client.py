from contextlib import asynccontextmanager
import aiohttp
import aiohttp_sse_client.client

from acp_sdk.schemas import Config, Input
from acp_sdk.server import RunInput, RunOutput


class AgentClient:
    def __init__(self, session: aiohttp.ClientSession):
        self._session = session

    async def run(self, input: Input):
        async with self._session.post(
            "/runs", json=RunInput(config=Config(), input=input).model_dump()
        ) as resp:
            return RunOutput.model_validate(await resp.json()).output

    async def run_stream(self, input: Input):
        async with aiohttp_sse_client.client.EventSource(
            "/runs",
            session=self._session,
            option={"method": "POST"},
            json=RunInput(config=Config(), input=input, stream=True).model_dump(),
        ) as event_source:
            async for event in event_source:
                if event.type == "end":
                    await event_source.close()
                    break
                else:
                    yield RunOutput.model_validate_json(event.data).output


@asynccontextmanager
async def create_client(url: str):
    async with aiohttp.ClientSession(url) as session:
        yield AgentClient(session)

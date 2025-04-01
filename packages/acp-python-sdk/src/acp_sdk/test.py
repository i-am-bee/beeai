import asyncio
import uuid
from acp_sdk.models import RunAwait, RunInput, RunOutput, RunStream, SessionId
from acp_sdk.server.agent import Agent
from acp_sdk.client import create_client
from acp_sdk.server.server import serve


class StatelessAgent(Agent):
    def name(self):
        return "stateless"

    async def run(self, input: RunInput):
        yield RunStream()  # Stream
        yield RunAwait()  # Await
        return RunOutput(text=f"{input.text} back at ya!")


class StatefulAgent(Agent):
    sessions: dict[SessionId, str] = dict()

    def name(self):
        return "stateful"

    async def run(self, input: RunInput, session_id: SessionId):
        yield RunStream()
        yield RunAwait()
        return RunOutput(text=f"{input.text} back at ya!")

    @staticmethod
    async def session(session_id: SessionId | None):
        if session_id and session_id not in StatefulAgent.sessions:
            raise ValueError("Invalid session")
        return session_id or uuid.uuid4()


def test_server():
    asyncio.run(serve(StatelessAgent()))


async def client():
    async with create_client("http://localhost:8000") as client:
        output = await client.run(RunInput(text="Howdy"))
        print(output)

        async for output in client.run_stream(RunInput(text="Howdy again")):
            print(output)


def test_client():
    asyncio.run(client())

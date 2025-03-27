import asyncio
from acp_sdk.agent import Agent
from acp_sdk.client import create_client
from acp_sdk.schemas import Input, Output
from acp_sdk.server import serve


class EchoAgent(Agent):
    async def run(self, input: Input):
        return Output(text=f"{input.text} back at ya!")

    async def run_stream(self, input: Input):
        yield Output(text=input.text)
        await asyncio.sleep(2)
        yield Output(text=" back at ya!")


async def client():
    async with create_client("http://localhost:8000") as client:
        output = await client.run(Input(text="Howdy"))
        print(output)

        async for output in client.run_stream(Input(text="Howdy again")):
            print(output)


def test_server():
    asyncio.run(serve(EchoAgent()))


def test_client():
    asyncio.run(client())

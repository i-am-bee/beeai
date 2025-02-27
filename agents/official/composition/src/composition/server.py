import asyncio


from acp.server.highlevel import Server
from beeai_sdk.providers.agent import run_agent_provider
from composition.linear_workflow import add_sequential_workflow_agent


async def run():
    server = Server("composition-agents")
    add_sequential_workflow_agent(server)
    await run_agent_provider(server)


def main():
    asyncio.run(run())


if __name__ == "__main__":
    main()

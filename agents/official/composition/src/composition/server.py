import asyncio


from acp.server.highlevel import Server
from beeai_sdk.providers.agent import run_agent_provider
from .prompted_sequential_workflow import add_prompted_sequential_workflow_agent
from .sequential_workflow import add_sequential_workflow_agent


async def run():
    server = Server("composition-agents")
    add_sequential_workflow_agent(server)
    add_prompted_sequential_workflow_agent(server)
    await run_agent_provider(server)


def main():
    asyncio.run(run())


if __name__ == "__main__":
    main()

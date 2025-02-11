from mcp.server.fastmcp import FastMCP

async def run_agent_provider(server: FastMCP):
    await server.run_sse_async()

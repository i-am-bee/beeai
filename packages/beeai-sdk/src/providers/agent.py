import os

from mcp.server.fastmcp import FastMCP

async def run_agent_provider(server: FastMCP):
    server.settings.port = int(os.getenv("PORT", "8000"))
    await server.run_sse_async()

"""
FastMCP Echo Server
"""

from acp.server.highlevel import Server

# Create server
mcp = Server("Echo Server")


@mcp.tool()
def echo(text: str) -> str:
    """Echo the input text"""
    return text

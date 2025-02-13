from pydantic import BaseModel

from mcp.server.fastmcp import Context, FastMCP


class Input(BaseModel):
    prompt: str

class Output(BaseModel):
    text: str

mcp = FastMCP()

@mcp.agent(
    name="Echoagent",
    description="Echoing agent",
    input=Input,
    output=Output
)
async def run_agent(input: Input, ctx: Context) -> Output:
    agent = "Echoagent"
    return Output(text=f"{agent}: Your prompt was {input.prompt}")


if __name__ == "__main__":
    mcp.run()

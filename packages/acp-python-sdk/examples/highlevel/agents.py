from pydantic import BaseModel

from acp.server.highlevel import Context, Server


class Input(BaseModel):
    prompt: str


class Output(BaseModel):
    text: str


acp_server = Server()


@acp_server.agent(
    name="Echoagent", description="Echoing agent", input=Input, output=Output
)
async def run_agent(input: Input, ctx: Context) -> Output:
    agent = "Echoagent"
    return Output(text=f"{agent}: Your prompt was {input.prompt}")


if __name__ == "__main__":
    acp_server.run()

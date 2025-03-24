from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from acp_sdk.agent import Agent
from acp_sdk.schemas import Config, Input, Output
import uvicorn


class RunInput(BaseModel):
    config: Config
    input: Input
    stream: bool = False


class RunOutput(BaseModel):
    output: Output


def encode_sse(model: BaseModel):
    return f"data: {model.model_dump_json()}\n\n"


async def serve(agent: Agent):
    app = FastAPI()

    @app.post("/runs")
    async def run(run: RunInput) -> RunOutput:
        if run.stream:

            async def stream_outputs():
                async for output in agent.run_stream(run.input):
                    yield encode_sse(RunOutput(output=output))
                yield "event: end\ndata: {}\n\n"

            return StreamingResponse(
                stream_outputs(),
                media_type="text/event-stream",
            )
        else:
            output = await agent.run(run.input)
            return RunOutput(output=output)

    config = uvicorn.Config(app=app, host="0.0.0.0", port=8000, log_level="info")
    server = uvicorn.Server(config)
    await server.serve()

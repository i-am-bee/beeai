import asyncio
import uuid

from fastapi import FastAPI, HTTPException
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
    id: str = uuid.uuid4()
    output: Output | None = None


def encode_sse(model: BaseModel):
    return f"data: {model.model_dump_json()}\n\n"


async def serve(agent: Agent):
    app = FastAPI()

    run_tasks: dict[str, asyncio.Task] = dict()

    @app.post("/runs")
    async def _(run: RunInput) -> RunOutput:
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
            output = RunOutput()
            task = asyncio.create_task(agent.run(run.input))
            dict[output.id] = task
            return output

    @app.get("/runs/{run_id}")
    async def _(run_id: str) -> RunOutput:
        task = run_tasks.get(run_id, None)
        if not task:
            raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
        output = RunOutput(id=run_id)
        if task.done:
            output.output = task.result
        return output

    config = uvicorn.Config(app=app, host="0.0.0.0", port=8000, log_level="info")
    server = uvicorn.Server(config)
    await server.serve()

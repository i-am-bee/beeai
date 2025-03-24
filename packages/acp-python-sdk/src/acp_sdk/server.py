import asyncio
from enum import Enum
from typing import Literal
import uuid

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, computed_field

from acp_sdk.agent import Agent
from acp_sdk.schemas import Input, Output
import uvicorn


RunId = str


class RunMode(str, Enum):
    SYNC = "sync"
    ASYNC = "async"
    STREAM = "stream"


class RunStatus(str, Enum):
    CREATED = "created"
    IN_PROGRESS = "in-progress"
    INTERRUPTED = "interrupted"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class OutputInterrupt(BaseModel):
    type: Literal["output"] = "output"
    output: Output


Interrupt = OutputInterrupt


class RunCreateBody(BaseModel):
    input: Input
    mode: RunMode = RunMode.SYNC


class RunResumeBody(BaseModel):
    interrupt: Interrupt
    mode: RunMode = RunMode.SYNC


class Run(BaseModel):
    run_id: RunId = str(uuid.uuid4())
    status: RunStatus = RunStatus.CREATED
    interrupt: Interrupt | None = None
    output: Output | None = None


class RunBundle(BaseModel):
    output: Run
    task: asyncio.Task = Field(exclude=True)


def encode_sse(model: BaseModel):
    return f"data: {model.model_dump_json()}\n\n"


async def execute_agent(agent: Agent, input: RunCreateBody, output: Run):
    try:
        output.status = RunStatus.IN_PROGRESS
        async for output in agent.run(input.input):
            output.interrupt = Interrupt(output=output)
            output.status = RunStatus.INTERRUPTED
    except StopAsyncIteration as e:
        output.output = e.value
        output.status = RunStatus.COMPLETED
    except asyncio.CancelledError:
        output.status = RunStatus.CANCELLED
    except:
        output.status = RunStatus.FAILED


async def serve(agent: Agent):
    app = FastAPI()

    runs: dict[str, RunBundle] = dict()

    @app.post("/runs")
    async def create(run: RunCreateBody) -> Run:
        if run.mode == RunMode.STREAM:

            async def stream_outputs():
                async for output in agent.run_stream(run.input):
                    yield encode_sse(Run(output=output))
                yield "event: end\ndata: {}\n\n"

            return StreamingResponse(
                stream_outputs(),
                media_type="text/event-stream",
            )
        else:
            output = Run()
            task = asyncio.create_task(execute_agent(agent, run, output))
            runs[output.run_id] = RunBundle(output=output, task=task)
            if run.mode == RunMode.SYNC:
                await task
            return output

    @app.get("/runs/{run_id}")
    async def read(run_id: str) -> Run:
        bundle = runs.get(run_id, None)
        if not bundle:
            raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
        return bundle.output

    @app.post("/runs/{run_id}")
    async def resume(run_id: str, resume: RunResumeBody) -> Run:
        bundle = runs.get(run_id, None)
        if not bundle:
            raise HTTPException(status_code=404, detail=f"Run {run_id} not found")

    @app.post("/runs/{run_id}/cancel")
    async def cancel(run_id: str) -> Run:
        bundle = runs.get(run_id, None)
        if not bundle:
            raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
        bundle.task.cancel()
        await bundle.task  # wait for cancellation
        return bundle.output

    config = uvicorn.Config(app=app, host="0.0.0.0", port=8000, log_level="info")
    server = uvicorn.Server(config)
    await server.serve()

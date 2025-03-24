import asyncio
import uuid

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse

import uvicorn

from acp_sdk.server.agent import Agent
from acp_sdk.models import (
    Run,
    RunCreateRequest,
    RunId,
    RunMode,
    RunResumeRequest,
    RunStatus,
)
from acp_sdk.server.bundle import RunBundle
from acp_sdk.server.utils import execute, stream


async def serve(agent: Agent):
    app = FastAPI()

    runs: dict[str, RunBundle] = dict()

    def find_run_bundle(run_id: RunId):
        bundle = runs.get(run_id, None)
        if not bundle:
            raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
        return bundle

    @app.post("/runs")
    async def create(run: RunCreateRequest) -> Run:
        if run.agent_name != agent.name:
            raise HTTPException(
                status_code=404, detail=f"Agent {run.agent_name} not found"
            )

        bundle = RunBundle(
            agent=agent, run=Run(run_id=uuid.uuid4(), agent_name=agent.name)
        )
        bundle.task = asyncio.create_task(execute(bundle, run.input))
        runs[bundle.run.run_id] = bundle

        if run.mode == RunMode.STREAM:
            return StreamingResponse(
                stream(bundle),
                media_type="text/event-stream",
            )
        else:
            if run.mode == RunMode.SYNC:
                await asyncio.wait(
                    [bundle.task, bundle.await_queue.get()],
                    return_when=asyncio.FIRST_COMPLETED,
                )
            return bundle.run

    @app.get("/runs/{run_id}")
    async def read(run_id: RunId) -> Run:
        bundle = find_run_bundle(run_id)
        return bundle.run

    @app.post("/runs/{run_id}")
    async def resume(run_id: RunId, resume: RunResumeRequest) -> Run:
        bundle = find_run_bundle(run_id)
        if resume.mode == RunMode.STREAM:
            return StreamingResponse(
                stream(bundle),
                media_type="text/event-stream",
            )
        else:
            if resume.mode == RunMode.SYNC:
                await asyncio.wait(
                    [bundle.task, bundle.await_queue.join()],
                    return_when=asyncio.FIRST_COMPLETED,
                )
            return bundle.run

    @app.post("/runs/{run_id}/cancel")
    async def cancel(run_id: RunId) -> Run:
        bundle = find_run_bundle(run_id)
        bundle.task.cancel()
        bundle.run.status = RunStatus.CANCELLING
        return bundle.run

    config = uvicorn.Config(app=app, host="0.0.0.0", port=8000, log_level="info")
    server = uvicorn.Server(config)
    await server.serve()

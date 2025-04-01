import asyncio

from pydantic import BaseModel


from acp_sdk.models import RunAwait, RunInput, RunStatus, RunStream
from acp_sdk.server.bundle import RunBundle


def encode_sse(model: BaseModel):
    return f"data: {model.model_dump_json()}\n\n"


async def stream(bundle: RunBundle):
    while bundle.run.status == RunStatus.IN_PROGRESS:
        step = await bundle.stream_output_queue.get()
        yield encode_sse(step)
        bundle.stream_output_queue.task_done()


async def execute(
    bundle: RunBundle,
    input: RunInput,
):
    bundle.run.session_id = await bundle.agent.session()

    generator = bundle.agent.run(input=input, session_id=bundle.run.session_id)
    try:
        wait = None
        while True:
            bundle.run.status = RunStatus.IN_PROGRESS
            next = await generator.asend(wait)
            if isinstance(next, RunStream):
                await bundle.stream_output_queue.put(next)
            elif isinstance(next, RunAwait):
                bundle.run.await_
                bundle.run.status = RunStatus.AWAITING
                bundle.await_queue.empty()
                bundle.await_queue.put_nowait(bundle.run.await_)
                wait = await bundle.await_resume_queue.get()
                bundle.await_resume_queue.task_done()
            else:
                raise TypeError()
    except StopAsyncIteration as e:
        bundle.run.output = e.value
        bundle.run.status = RunStatus.COMPLETED
    except asyncio.CancelledError:
        bundle.run.status = RunStatus.CANCELLED
    except:
        bundle.run.status = RunStatus.FAILED

import asyncio
import logging

from pydantic import BaseModel


from acp_sdk.models import AwaitEvent, Message, Await, MessageEvent, RunStatus
from acp_sdk.server.bundle import RunBundle
from acp_sdk.server.context import Context


logger = logging.getLogger("uvicorn.error")


def encode_sse(model: BaseModel):
    return f"data: {model.model_dump_json()}\n\n"


async def stream(bundle: RunBundle):
    try:
        while True:
            message = await bundle.stream_queue.get()
            yield encode_sse(MessageEvent(run_id=bundle.run.run_id, message=message))
            bundle.stream_queue.task_done()
    except asyncio.QueueShutDown:
        pass

    if bundle.run.status == RunStatus.AWAITING:
        if not bundle.run.await_:
            raise RuntimeError("Missing await data")
        yield encode_sse(
            AwaitEvent.model_validate(
                {
                    "run_id": bundle.run.run_id,
                    "type": "await",
                    "await": bundle.run.await_,
                }
            )
        )


async def wait(bundle: RunBundle):
    await bundle.await_or_terminate_event.wait()


async def execute(
    bundle: RunBundle,
    input: Message,
):
    try:
        bundle.run.session_id = await bundle.agent.session(bundle.run.session_id)
        generator = bundle.agent.run(
            input=input, context=Context(session_id=bundle.run.session_id)
        )

        await_resume = None
        while True:
            bundle.run.status = RunStatus.IN_PROGRESS
            next = await generator.asend(await_resume)
            if isinstance(next, Message):
                bundle.composed_message += next
                await bundle.stream_queue.put(next)
            elif isinstance(next, Await):
                bundle.run.await_ = next
                bundle.run.status = RunStatus.AWAITING
                bundle.stream_queue.shutdown()
                bundle.await_or_terminate_event.set()  # notify sync requests
                bundle.await_or_terminate_event.clear()
                await_resume = await bundle.await_queue.get()
                bundle.await_queue.task_done()
            else:
                raise TypeError()
    except StopAsyncIteration as e:
        bundle.run.output = bundle.composed_message
        bundle.run.status = RunStatus.COMPLETED
    except asyncio.CancelledError:
        bundle.run.status = RunStatus.CANCELLED
    except Exception as e:
        bundle.run.status = RunStatus.FAILED
        logger.exception(e)
    finally:
        bundle.await_or_terminate_event.set()
        bundle.stream_queue.shutdown()

# Copyright 2025 IBM Corp.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import logging
import uuid
from contextlib import asynccontextmanager, AsyncExitStack
from typing import AsyncGenerator

import anyio

from acp import ClientSession, types, ServerNotification
from acp.client.sse import sse_client
from acp.shared.session import ReceiveResultT
from acp.types import RequestParams

logger = logging.getLogger(__name__)


@asynccontextmanager
async def mcp_client(url: str) -> AsyncGenerator[ClientSession, None]:
    """Context manager for MCP client connection."""
    async with sse_client(url=url) as (read_stream, write_stream):
        async with ClientSession(read_stream, write_stream) as session:
            await session.initialize()
            yield session


async def send_request_with_notifications(
    url_or_session: str | ClientSession, req: types.Request, result_type: type[ReceiveResultT]
) -> AsyncGenerator[ReceiveResultT | ServerNotification | None, None]:
    resp: ReceiveResultT | None = None
    async with AsyncExitStack() as exit_stack:
        if isinstance(url_or_session, str):
            session = await exit_stack.enter_async_context(mcp_client(url=url_or_session))
            await session.initialize()
        else:
            session = url_or_session

        message_writer, message_reader = anyio.create_memory_object_stream()

        req = types.ClientRequest(req).root
        req.params = req.params or RequestParams()
        req.params.meta = RequestParams.Meta(progressToken=uuid.uuid4().hex)
        req = types.ClientRequest(req)

        async with anyio.create_task_group() as task_group:

            async def request_task():
                nonlocal resp
                try:
                    resp = await session.send_request(req, result_type)
                finally:
                    task_group.cancel_scope.cancel()

            async def read_notifications():
                # IMPORTANT(!) if the client does not read the notifications, it gets blocked never receiving the response
                async for message in session.incoming_messages:
                    try:
                        if isinstance(message, Exception):
                            raise message
                        notification = ServerNotification.model_validate(message)
                        await message_writer.send(notification)
                    except ValueError:
                        logger.warning(f"Unable to parse message from server: {message}")

            task_group.start_soon(read_notifications)
            task_group.start_soon(request_task)

            async for message in message_reader:
                yield message
    if resp:
        yield resp


async def send_request(url_or_session: str, req: types.Request, result_type: type[ReceiveResultT]) -> ReceiveResultT:
    async for message in send_request_with_notifications(url_or_session, req, result_type):
        if isinstance(message, result_type):
            return message
    raise RuntimeError(f"No response of type {result_type.__name__} was returned")

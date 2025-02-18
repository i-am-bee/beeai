from typing import AsyncGenerator

from anyio.streams.memory import MemoryObjectReceiveStream, MemoryObjectSendStream
from acp.types import JSONRPCMessage

type ID = str

type McpClient = AsyncGenerator[
    tuple[MemoryObjectReceiveStream[JSONRPCMessage | Exception], MemoryObjectSendStream[JSONRPCMessage]]
]

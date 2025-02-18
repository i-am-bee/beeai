from typing import AsyncGenerator, TypeAlias

from anyio.streams.memory import MemoryObjectReceiveStream, MemoryObjectSendStream
from acp.types import JSONRPCMessage

ID: TypeAlias = str

McpClient: TypeAlias = AsyncGenerator[
    tuple[MemoryObjectReceiveStream[JSONRPCMessage | Exception], MemoryObjectSendStream[JSONRPCMessage]], None
]

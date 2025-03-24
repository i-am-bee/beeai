import abc
from typing import Any, AsyncGenerator

from acp_sdk.schemas import Input, Output


class Agent(abc.ABC):
    @abc.abstractmethod
    async def run(self, input: Input) -> AsyncGenerator[Output, Any, Output]:
        pass

    async def run_stream(self, input: Input) -> AsyncGenerator[Output, Any, Output]:
        yield await self.run(input)

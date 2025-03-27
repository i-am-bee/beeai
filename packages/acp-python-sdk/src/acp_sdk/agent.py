import abc
from typing import AsyncIterator

from acp_sdk.schemas import Input, Output


class Agent(abc.ABC):
    @abc.abstractmethod
    async def run(self, input: Input) -> Output:
        pass

    async def run_stream(self, input: Input) -> AsyncIterator[Output]:
        yield await self.run(input)

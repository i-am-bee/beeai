import abc
from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator

from acp_sdk.models import (
    AgentName,
    RunAwait,
    RunAwaitResume,
    RunInput,
    RunOutput,
    RunStream,
    SessionId,
)


class Agent(abc.ABC):
    session_id: SessionId | None = None

    @property
    @abc.abstractmethod()
    def name(self) -> AgentName:
        pass

    @abc.abstractmethod
    def run(
        self, input: RunInput, session_id: SessionId | None = None
    ) -> AsyncGenerator[RunStream | RunAwait, RunAwaitResume, RunOutput]:
        pass

    @staticmethod
    async def session(session_id: SessionId | None) -> SessionId | None:
        if session_id:
            raise NotImplementedError()
        return None

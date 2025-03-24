from enum import Enum
from typing import Literal, Union

from pydantic import AnyUrl, BaseModel, Field

AgentName = str
SessionId = str
RunId = str


class RunMode(str, Enum):
    SYNC = "sync"
    ASYNC = "async"
    STREAM = "stream"


class RunStatus(str, Enum):
    CREATED = "created"
    IN_PROGRESS = "in-progress"
    AWAITING = "awaiting"
    CANCELLING = "cancelling"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    FAILED = "failed"


class TextMessagePart(BaseModel):
    type: Literal["text"]
    content: str


class ImageMessagePart(BaseModel):
    type: Literal["image"]
    content_url: AnyUrl


class ArtifactMessagePart(BaseModel):
    type: Literal["artifact"]
    name: str
    content_url: AnyUrl


MessagePart = Union[TextMessagePart, ImageMessagePart, ArtifactMessagePart]
Message = list[MessagePart]


class RunInput(Message):
    pass


class RunOutput(Message):
    pass


class RunStream(Message):
    pass


class RunAwait(BaseModel):
    pass


class RunAwaitResume(BaseModel):
    pass


class RunCreateRequest(BaseModel):
    agent_name: AgentName
    session_id: SessionId | None
    input: RunInput
    mode: RunMode


class RunResumeRequest(BaseModel):
    interrupt: RunAwaitResume
    mode: RunMode


class Run(BaseModel):
    run_id: RunId
    session_id: SessionId | None
    agent_name: AgentName
    status: RunStatus
    await_: RunAwait = Field(alias="await")
    output: RunOutput

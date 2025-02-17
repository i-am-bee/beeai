from typing import Annotated, Literal, Union
from pydantic import BaseModel, Discriminator


class UserMessage(BaseModel):
    role: Literal["user"]
    content: str


class AssistantMessage(BaseModel):
    role: Literal["assistant"]
    content: str


Message = Annotated[Union[UserMessage, AssistantMessage], Discriminator("role")]


class MessageInput(BaseModel):
    messages: list[Message]


class MessageOutput(BaseModel):
    messages: list[Message]

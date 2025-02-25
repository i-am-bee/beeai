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
import json
from typing import Annotated, Literal, Union, Self
from pydantic import BaseModel, Discriminator, model_validator, Field

from beeai_sdk.schemas.base import TextInput, TextOutput


class UserMessage(BaseModel):
    role: Literal["user"]
    content: str


class AssistantMessage(BaseModel):
    role: Literal["assistant"]
    content: str


Message = Annotated[Union[UserMessage, AssistantMessage], Discriminator("role")]


class MessageInput(TextInput):
    messages: list[Message] = Field(default_factory=list)
    text: str = ""

    @model_validator(mode="after")
    def validate_messages(self) -> Self:
        if not (bool(self.messages) ^ bool(self.text)):
            raise ValueError("Must specify exactly one of messages and text")
        if not self.messages:
            self.messages = [UserMessage(content=self.text, role="user")]
        return self


class MessageOutput(TextOutput):
    messages: list[Message]
    text: str = ""

    @model_validator(mode="after")
    def validate_messages(self) -> Self:
        if self.text:
            raise ValueError("Text is a computed property and cannot be directly set")
        self.text = json.dumps([m.model_dump(mode="json") for m in self.messages])
        return self

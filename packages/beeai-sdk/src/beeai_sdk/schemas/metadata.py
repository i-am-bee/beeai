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

from enum import StrEnum
from typing import Optional

from pydantic import BaseModel


class UiType(StrEnum):
    chat = "chat"
    hands_off = "hands-off"
    custom = "custom"


class CliExample(BaseModel, extra="allow"):
    command: str
    name: Optional[str] = None
    description: Optional[str] = None
    output: Optional[str] = None
    processingSteps: Optional[list[str]] = None


class UiDefinition(BaseModel, extra="allow"):
    type: UiType
    userGreeting: str | None = None


class Examples(BaseModel, extra="allow"):
    cli: Optional[list[CliExample]] = None


class Metadata(BaseModel, extra="allow"):
    title: Optional[str] = None
    fullDescription: Optional[str] = None
    framework: Optional[str] = None
    license: Optional[str] = None
    languages: Optional[list[str]] = None
    githubUrl: Optional[str] = None
    examples: Optional[Examples] = None
    avgRunTimeSeconds: Optional[float] = None
    avgRunTokens: Optional[float] = None
    tags: Optional[list[str]] = None
    ui: Optional[UiDefinition] = None
    provider: Optional[str] = None

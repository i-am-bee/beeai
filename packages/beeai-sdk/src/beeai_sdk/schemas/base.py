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

from pydantic import BaseModel, Field


class Config(BaseModel, extra="allow"):
    pass


class Input(BaseModel, extra="allow"):
    config: Config | None = None


class LogLevel(StrEnum):
    error = "error"
    warning = "warning"
    info = "info"
    cite = "cite"
    success = "success"


class Log(BaseModel, extra="allow"):
    level: LogLevel = LogLevel.info
    message: str


class Output(BaseModel, extra="allow"):
    logs: list[Log | None] = Field(default_factory=list)

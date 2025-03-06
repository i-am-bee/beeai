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

from typing import TypeVar, Generic, Any
from pydantic import BaseModel, RootModel

from beeai_server.domain.model import ManifestLocation

BaseModelT = TypeVar("BaseModelT", bound=BaseModel)


class PaginatedResponse(BaseModel, Generic[BaseModelT]):
    items: list[BaseModelT]
    total_count: int


class CreateProviderRequest(BaseModel):
    location: ManifestLocation


class UpdateEnvRequest(BaseModel):
    env: dict[str, str | None]


class ListEnvSchema(BaseModel):
    env: dict[str, str]


class UpdateTelemetryConfigRequest(BaseModel):
    sharing_enabled: bool


RunAgentInput = RootModel[dict[str, Any]]


DeleteProviderRequest = CreateProviderRequest

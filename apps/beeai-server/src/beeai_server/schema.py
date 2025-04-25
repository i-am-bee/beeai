# Copyright 2025 © BeeAI a Series of LF Projects, LLC
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
from pydantic import BaseModel, RootModel, Field

from beeai_server.custom_types import ID
from beeai_server.domain.provider.model import (
    ProviderLocation,
    EnvVar,
    ProviderManifest,
    ProviderStatus,
    ProviderErrorMessage,
    NetworkProviderLocation,
)
from beeai_server.domain.registry import RegistryLocation

BaseModelT = TypeVar("BaseModelT", bound=BaseModel)


class PaginatedResponse(BaseModel, Generic[BaseModelT]):
    items: list[BaseModelT]
    total_count: int


class CreateManagedProviderRequest(BaseModel):
    location: ProviderLocation


class InstallProviderRequest(BaseModel):
    location: ProviderLocation


class RegisterUnmanagedProviderRequest(BaseModel):
    location: NetworkProviderLocation
    id: ID | None = Field(default=None, deprecated=True)


class UpdateVariablesRequest(BaseModel):
    env: dict[str, str | None]


class ListVariablesSchema(BaseModel):
    env: dict[str, str]


class UpdateTelemetryConfigRequest(BaseModel):
    sharing_enabled: bool


RunAgentInput = RootModel[dict[str, Any]]


class ProviderWithStatus(BaseModel, extra="allow"):
    id: ID
    location: str
    registry: RegistryLocation | None = None
    manifest: ProviderManifest
    status: ProviderStatus
    last_error: ProviderErrorMessage | None = None
    missing_configuration: list[EnvVar] = Field(default_factory=list)


class ErrorStreamResponseError(BaseModel, extra="allow"):
    status_code: int
    type: str
    detail: str


class ErrorStreamResponse(BaseModel, extra="allow"):
    error: ErrorStreamResponseError

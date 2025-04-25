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
from pydantic import BaseModel, RootModel, Field, model_validator, AnyUrl

from beeai_server.custom_types import ID
from beeai_server.domain.model import (
    ProviderLocation,
    LoadedProviderStatus,
    LoadProviderErrorMessage,
    EnvVar,
    ProviderManifest,
)
from beeai_server.utils.github import ResolvedGithubUrl

BaseModelT = TypeVar("BaseModelT", bound=BaseModel)


class PaginatedResponse(BaseModel, Generic[BaseModelT]):
    items: list[BaseModelT]
    total_count: int


class CreateManagedProviderRequest(BaseModel):
    location: ProviderLocation


class InstallProviderRequest(BaseModel):
    id: ID | None = None
    location: ProviderLocation | None = None

    @model_validator(mode="after")
    def level_uvicorn_validator(self):
        if not (bool(self.id) ^ bool(self.location)):
            raise ValueError("Exactly one of `location` or `id` must be specified")
        return self


class RegisterUnmanagedProviderRequest(BaseModel):
    location: AnyUrl
    id: ID


class UpdateEnvRequest(BaseModel):
    env: dict[str, str | None]


class ListEnvSchema(BaseModel):
    env: dict[str, str]


class UpdateTelemetryConfigRequest(BaseModel):
    sharing_enabled: bool


RunAgentInput = RootModel[dict[str, Any]]


DeleteProviderRequest = InstallProviderRequest
StreamLogsRequest = InstallProviderRequest


class ProviderWithStatus(BaseModel, extra="allow"):
    id: ID
    registry: ResolvedGithubUrl | None = None
    manifest: ProviderManifest
    status: LoadedProviderStatus
    last_error: LoadProviderErrorMessage | None = None
    missing_configuration: list[EnvVar] = Field(default_factory=list)


class ErrorStreamResponseError(BaseModel, extra="allow"):
    status_code: int
    type: str
    detail: str


class ErrorStreamResponse(BaseModel, extra="allow"):
    error: ErrorStreamResponseError

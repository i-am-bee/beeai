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

import fastapi
from pydantic import BaseModel, AnyUrl

from beeai_server.custom_types import ID
from beeai_server.domain.model import ProviderWithStatus, UnmanagedProvider, AgentManifest
from beeai_server.routes.dependencies import ProviderServiceDependency
from beeai_server.schema import (
    CreateManagedProviderRequest,
    DeleteProviderRequest,
    InstallProviderRequest,
    PaginatedResponse,
)
from fastapi import Query
from starlette.responses import StreamingResponse

router = fastapi.APIRouter()


@router.post("/managed/register")
async def create_managed_provider(
    request: CreateManagedProviderRequest, provider_service: ProviderServiceDependency
) -> ProviderWithStatus:
    return await provider_service.register_managed_provider(location=request.location)


class ProviderRequest(BaseModel):
    location: AnyUrl
    id: ID
    manifest: AgentManifest


@router.post("/unmanaged/register")
async def add_unmanaged_provider(
    provider: ProviderRequest, provider_service: ProviderServiceDependency
) -> ProviderWithStatus:
    return await provider_service.register_unmanaged_provider(UnmanagedProvider.model_validate(provider.model_dump()))


@router.post("/install")
async def install_provider(
    request: InstallProviderRequest, provider_service: ProviderServiceDependency
) -> StreamingResponse:
    logs_iterator = await provider_service.install_provider(id=request.id)
    return StreamingResponse(logs_iterator(), media_type="text/event-stream")


@router.post("/preview")
async def preview_provider(
    request: CreateManagedProviderRequest, provider_service: ProviderServiceDependency
) -> ProviderWithStatus:
    return await provider_service.preview_provider(location=request.location)


@router.get("")
async def list_providers(provider_service: ProviderServiceDependency) -> PaginatedResponse[ProviderWithStatus]:
    providers = await provider_service.list_providers()
    return PaginatedResponse(items=providers, total_count=len(providers))


@router.post("/delete", status_code=fastapi.status.HTTP_204_NO_CONTENT)
async def delete_provider(request: DeleteProviderRequest, provider_service: ProviderServiceDependency) -> None:
    await provider_service.delete_provider(id=request.id)


@router.put("/sync")
async def sync_provider_repository(provider_service: ProviderServiceDependency):
    """Sync external changes to a provider repository."""
    await provider_service.sync()


@router.get("/logs", status_code=fastapi.status.HTTP_204_NO_CONTENT)
async def stream_logs(
    provider_service: ProviderServiceDependency, id: str = Query(..., description="Provider ID")
) -> StreamingResponse:
    logs_iterator = await provider_service.stream_logs(id=id)
    return StreamingResponse(logs_iterator(), media_type="text/event-stream")

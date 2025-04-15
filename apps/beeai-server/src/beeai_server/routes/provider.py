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

import fastapi

from beeai_server.routes.dependencies import ProviderServiceDependency
from beeai_server.schema import (
    CreateManagedProviderRequest,
    DeleteProviderRequest,
    InstallProviderRequest,
    PaginatedResponse,
    ProviderWithStatus,
    RegisterUnmanagedProviderRequest,
)
from fastapi import Query, BackgroundTasks
from starlette.responses import StreamingResponse

router = fastapi.APIRouter()


@router.post("/register/managed")
async def create_managed_provider(
    request: CreateManagedProviderRequest, provider_service: ProviderServiceDependency
) -> ProviderWithStatus:
    return await provider_service.register_managed_provider(location=request.location)


@router.post("/register/unmanaged")
async def add_unmanaged_provider(
    request: RegisterUnmanagedProviderRequest, provider_service: ProviderServiceDependency
) -> None:
    await provider_service.register_unmanaged_provider(location=request.location, id=request.id)


@router.post("/install")
async def install_provider(
    request: InstallProviderRequest,
    provider_service: ProviderServiceDependency,
    background_tasks: BackgroundTasks,
    stream: bool = Query(False),
) -> StreamingResponse:
    iterator_or_awaitable = await provider_service.install_provider(
        id=request.id, location=request.location, stream=stream
    )
    if stream:
        return StreamingResponse(iterator_or_awaitable(), media_type="text/event-stream")
    else:
        background_tasks.add_task(iterator_or_awaitable)


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


@router.get("/logs", status_code=fastapi.status.HTTP_204_NO_CONTENT)
async def stream_logs(
    provider_service: ProviderServiceDependency, id: str = Query(..., description="Provider ID")
) -> StreamingResponse:
    logs_iterator = await provider_service.stream_logs(id=id)
    return StreamingResponse(logs_iterator(), media_type="text/event-stream")

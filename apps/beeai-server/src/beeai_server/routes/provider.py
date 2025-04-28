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
from starlette.status import HTTP_202_ACCEPTED

from beeai_server.custom_types import ID
from beeai_server.domain.provider.model import GithubProviderLocation
from beeai_server.routes.dependencies import ProviderServiceDependency
from beeai_server.schema import (
    CreateManagedProviderRequest,
    PaginatedResponse,
    ProviderWithStatus,
    RegisterUnmanagedProviderRequest,
)
from fastapi import Query, BackgroundTasks
from fastapi.responses import Response
from starlette.responses import StreamingResponse

from beeai_server.utils.fastapi import streaming_response

router = fastapi.APIRouter()


@router.post("/register/managed")
async def create_managed_provider(
    request: CreateManagedProviderRequest,
    provider_service: ProviderServiceDependency,
    background_tasks: BackgroundTasks,
    install: bool = Query(True),
    stream: bool = Query(False),
) -> ProviderWithStatus:
    if install:
        iterator_or_awaitable = await provider_service.install_provider(location=request.location, stream=stream)
        if stream:
            return streaming_response(iterator_or_awaitable())
        else:
            background_tasks.add_task(iterator_or_awaitable)
            return Response(status_code=HTTP_202_ACCEPTED)
    else:
        if isinstance(request.location, GithubProviderLocation):
            raise ValueError("Github provider must be installed to be registered, use /register/managed?install=true")
        return await provider_service.register_provider(location=request.location)


@router.post("/register/unmanaged")
async def add_unmanaged_provider(
    request: RegisterUnmanagedProviderRequest, provider_service: ProviderServiceDependency, persist: bool = Query(False)
) -> ProviderWithStatus:
    return await provider_service.register_provider(location=request.location, persist=persist)


@router.put("/{id}/install")
async def install_provider(
    id: ID,
    provider_service: ProviderServiceDependency,
    background_tasks: BackgroundTasks,
    stream: bool = Query(False),
) -> StreamingResponse:
    iterator_or_awaitable = await provider_service.install_provider(id=id, stream=stream)
    if stream:
        return streaming_response(iterator_or_awaitable())
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


@router.get("/{id}")
async def get_provider(id: ID, provider_service: ProviderServiceDependency) -> ProviderWithStatus:
    return await provider_service.get_provider(id)


@router.delete("/{id}", status_code=fastapi.status.HTTP_204_NO_CONTENT)
async def delete_provider(id: ID, provider_service: ProviderServiceDependency) -> None:
    await provider_service.delete_provider(id=id)


@router.get("/{id}/logs", status_code=fastapi.status.HTTP_204_NO_CONTENT)
async def stream_logs(id: ID, provider_service: ProviderServiceDependency) -> StreamingResponse:
    logs_iterator = await provider_service.stream_logs(id=id)
    return streaming_response(logs_iterator())

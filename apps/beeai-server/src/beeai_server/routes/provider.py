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

from beeai_server.domain.model import ProviderWithStatus
from beeai_server.routes.dependencies import ProviderServiceDependency
from beeai_server.schema import PaginatedResponse, CreateProviderRequest, DeleteProviderRequest

router = fastapi.APIRouter()


@router.post("")
async def create_provider(
    request: CreateProviderRequest, provider_service: ProviderServiceDependency
) -> ProviderWithStatus:
    return await provider_service.add_provider(location=request.location)


@router.post("/preview")
async def preview_provider(
    request: CreateProviderRequest, provider_service: ProviderServiceDependency
) -> ProviderWithStatus:
    return await provider_service.preview_provider(location=request.location)


@router.get("")
async def list_providers(provider_service: ProviderServiceDependency) -> PaginatedResponse[ProviderWithStatus]:
    providers = await provider_service.list_providers()
    return PaginatedResponse(items=providers, total_count=len(providers))


@router.post("/delete", status_code=fastapi.status.HTTP_204_NO_CONTENT)
async def delete_provider(request: DeleteProviderRequest, provider_service: ProviderServiceDependency) -> None:
    await provider_service.delete_provider(location=request.location)


@router.put("/sync")
async def sync_provider_repository(provider_service: ProviderServiceDependency):
    """Sync external changes to a provider repository."""
    await provider_service.sync()

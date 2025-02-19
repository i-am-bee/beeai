import fastapi

from beeai_server.routes.dependencies import ProviderServiceDependency
from beeai_server.schema import PaginatedResponse, CreateProviderRequest, DeleteProviderRequest

router = fastapi.APIRouter()


@router.post("")
async def create_provider(request: CreateProviderRequest, provider_service: ProviderServiceDependency):
    await provider_service.add_provider(request.location)
    return fastapi.Response(status_code=fastapi.status.HTTP_201_CREATED)


@router.get("")
async def list_providers(provider_service: ProviderServiceDependency):
    providers = await provider_service.list_providers()
    return PaginatedResponse(items=providers, total_count=len(providers))


@router.post("/delete")
async def delete_provider(request: DeleteProviderRequest, provider_service: ProviderServiceDependency):
    await provider_service.delete_provider(request.location)
    return fastapi.Response(status_code=fastapi.status.HTTP_204_NO_CONTENT)


@router.put("/sync")
async def sync_provider_repository(provider_service: ProviderServiceDependency):
    """Sync external changes to a provider repository."""
    await provider_service.sync()

from typing import TypeVar, Generic
from pydantic import BaseModel

from beeai_server.domain.model import ManifestLocation

BaseModelT = TypeVar("BaseModelT", bound=BaseModel)


class PaginatedResponse(BaseModel, Generic[BaseModelT]):
    items: list[BaseModelT]
    total_count: int


class CreateProviderRequest(BaseModel):
    location: ManifestLocation


DeleteProviderRequest = CreateProviderRequest

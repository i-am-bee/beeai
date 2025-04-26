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

from abc import ABC, abstractmethod
from typing import Generic, List, Optional, TypeVar

T = TypeVar("T")
C = TypeVar("C")
U = TypeVar("U")


class Repository(ABC, Generic[T, C, U]):
    """Base repository interface for CRUD operations."""

    @abstractmethod
    async def create(self, create_dto: C) -> T:
        """Create a new entity."""
        pass

    @abstractmethod
    async def get_by_id(self, entity_id: str) -> Optional[T]:
        """Get an entity by ID."""
        pass

    @abstractmethod
    async def list(self, skip: int = 0, limit: int = 100) -> List[T]:
        """List entities with pagination."""
        pass

    @abstractmethod
    async def update(self, entity_id: str, update_dto: U) -> Optional[T]:
        """Update an entity."""
        pass

    @abstractmethod
    async def delete(self, entity_id: str) -> bool:
        """Delete an entity."""
        pass

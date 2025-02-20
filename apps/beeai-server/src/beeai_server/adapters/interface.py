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

from typing import runtime_checkable, Protocol, AsyncIterator

from beeai_server.domain.model import Provider


@runtime_checkable
class IProviderRepository(Protocol):
    async def list(self) -> AsyncIterator[Provider]:
        yield

    async def create(self, *, provider: Provider) -> None: ...
    async def delete(self, *, provider_id: str) -> None: ...

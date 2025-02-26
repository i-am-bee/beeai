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

from beeai_server.routes.dependencies import EnvServiceDependency
from beeai_server.schema import UpdateEnvRequest, ListEnvSchema

router = fastapi.APIRouter()


@router.put("", status_code=fastapi.status.HTTP_201_CREATED)
async def update_env(request: UpdateEnvRequest, env_service: EnvServiceDependency) -> None:
    await env_service.update_env(env=request.env)


@router.get("")
async def list_env(env_service: EnvServiceDependency) -> ListEnvSchema:
    return ListEnvSchema(env=await env_service.list_env())


@router.put("/sync")
async def sync_provider_repository(env_service: EnvServiceDependency):
    """Sync external changes to an env repository."""
    await env_service.sync()

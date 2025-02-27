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

from acp import ListAgentsRequest, ListAgentsResult
from beeai_server.routes.dependencies import ConfigurationDependency
from beeai_sdk.utils.api import send_request

router = fastapi.APIRouter()


@router.get("")
async def list_agents(configuration: ConfigurationDependency) -> ListAgentsResult:
    return await send_request(
        url=f"http://localhost:{configuration.port}/mcp/sse",
        req=ListAgentsRequest(method="agents/list"),
        result_type=ListAgentsResult,
    )

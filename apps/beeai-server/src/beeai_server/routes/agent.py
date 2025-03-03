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

from typing import Any
import fastapi

from acp import ListAgentsRequest, ListAgentsResult, RunAgentResult
from acp.types import RunAgentRequestParams, RunAgentRequest, Agent
from beeai_sdk.utils.api import send_request
from beeai_server.configuration import Configuration
from beeai_server.routes.dependencies import ConfigurationDependency
from beeai_server.schema import PaginatedResponse, RunAgentInput

router = fastapi.APIRouter()


def _get_url(configuration: Configuration):
    return f"http://localhost:{configuration.port}/mcp/sse"


@router.get("")
async def list_agents(configuration: ConfigurationDependency) -> PaginatedResponse[Agent]:
    result = await send_request(
        url_or_session=_get_url(configuration),
        req=ListAgentsRequest(method="agents/list"),
        result_type=ListAgentsResult,
    )
    return PaginatedResponse(items=result.agents, total_count=len(result.agents))


@router.get("/{name}")
async def get_agent_detail(name: str, configuration: ConfigurationDependency) -> Agent:
    result = await send_request(
        url_or_session=_get_url(configuration),
        req=ListAgentsRequest(method="agents/list"),
        result_type=ListAgentsResult,
    )
    agents = [agent for agent in result.agents if agent.name == name]
    if len(agents) != 1:
        raise fastapi.HTTPException(status_code=404, detail="Agent not found")
    return agents[0]


@router.post("/{name}/run")
async def run_agent(name: str, input: RunAgentInput, configuration: ConfigurationDependency) -> dict[str, Any]:
    result = await send_request(
        url_or_session=_get_url(configuration),
        req=RunAgentRequest(method="agents/run", params=RunAgentRequestParams(name=name, input=input.root)),
        result_type=RunAgentResult,
    )
    return result.output

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

from contextlib import AsyncExitStack, AbstractAsyncContextManager
from typing import Any

import fastapi
import fastapi.responses
import httpx
from acp_sdk.models import (
    AgentName,
    AgentsListResponse as AcpAgentsListResponse,
    RunCancelResponse,
    RunCreateRequest,
    RunCreateResponse,
    RunId,
    RunReadResponse,
    RunResumeRequest,
    RunResumeResponse,
)

from beeai_server.domain.provider.model import Agent
from beeai_server.routes.dependencies import ProviderServiceDependency

router = fastapi.APIRouter()


class AgentsListResponse(AcpAgentsListResponse):
    agents: list[Agent]


class AgentReadResponse(Agent):
    pass


@router.get("/agents")
async def list_agents(provider_service: ProviderServiceDependency) -> AgentsListResponse:
    agents = await provider_service.list_agents()
    return AgentsListResponse(agents=agents)


@router.get("/agents/{name}")
async def read_agent(name: AgentName, provider_service: ProviderServiceDependency) -> AgentReadResponse:
    provider = await provider_service.get_provider_by_agent_name(agent_name=name)
    return [agent for agent in provider.agents if agent.name == name][0]


async def send_request(
    client_factory: AbstractAsyncContextManager[httpx.AsyncClient],
    method: str,
    url: str,
    json: dict[str, Any] | None = None,
) -> fastapi.responses.Response:
    exit_stack = AsyncExitStack()

    try:
        client = await exit_stack.enter_async_context(client_factory)
        response: httpx.Response = await exit_stack.enter_async_context(client.stream(method, url, json=json))

        async def stream_fn():
            try:
                async for event in response.stream:
                    yield event
            finally:
                await exit_stack.pop_all().aclose()

        if response.headers["content-type"].startswith("text/event-stream"):
            return fastapi.responses.StreamingResponse(
                stream_fn(),
                status_code=response.status_code,
                headers=response.headers,
                media_type=response.headers["content-type"],
            )
        else:
            try:
                await response.aread()
                return fastapi.responses.Response(
                    content=response.content,
                    status_code=response.status_code,
                    headers=response.headers,
                    media_type=response.headers["content-type"],
                )
            finally:
                await exit_stack.pop_all().aclose()
    except BaseException:
        await exit_stack.pop_all().aclose()
        raise


@router.post("/runs")
async def create_run(request: RunCreateRequest, provider_service: ProviderServiceDependency) -> RunCreateResponse:
    provider = await provider_service.get_provider_by_agent_name(agent_name=request.agent_name)
    return await send_request(provider.client(), "POST", "/runs", request.model_dump(mode="json"))


@router.get("/runs/{run_id}")
async def read_run(run_id: RunId, provider_service: ProviderServiceDependency) -> RunReadResponse:
    provider = await provider_service.get_provider_by_run_id(run_id=str(run_id))
    return await send_request(provider.client(), "GET", f"/runs/{run_id}")


@router.post("/runs/{run_id}")
async def resume_run(
    run_id: RunId, request: RunResumeRequest, provider_service: ProviderServiceDependency
) -> RunResumeResponse:
    provider = await provider_service.get_provider_by_run_id(run_id=str(run_id))
    return await send_request(provider.client(), "POST", f"/runs/{run_id}", request.model_dump(mode="json"))


@router.post("/runs/{run_id}/cancel")
async def cancel_run(run_id: RunId, provider_service: ProviderServiceDependency) -> RunCancelResponse:
    provider = await provider_service.get_provider_by_run_id(run_id=str(run_id))
    return await send_request(provider.client(), "POST", f"/runs/{run_id}/cancel")

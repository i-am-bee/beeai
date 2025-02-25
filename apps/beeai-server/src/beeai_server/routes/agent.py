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

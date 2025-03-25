from pydantic import AnyUrl, computed_field
from pydantic_settings import BaseSettings


class Configuration(BaseSettings):
    platform_url: AnyUrl = "http://localhost:8333"
    mcp_sse_path: str = "/mcp/sse"

    @computed_field
    @property
    def mcp_url(self) -> str:
        return f"{str(self.platform_url).strip('/')}{self.mcp_sse_path}"

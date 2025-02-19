from pydantic import BaseModel


class Config(BaseModel):
    """Base class for configuration models"""

    tools: list[str] | None = None

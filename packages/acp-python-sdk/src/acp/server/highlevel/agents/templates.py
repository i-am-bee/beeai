from typing import Awaitable, Callable, Type

from pydantic import BaseModel, ConfigDict, Field

from acp.server.highlevel.agents.base import Agent
from acp.server.highlevel.context import Context


class AgentTemplate(BaseModel):
    """A template for creating agents."""

    name: str = Field(description="Name of the agent")
    description: str | None = Field(description="Description of what the agent does")

    config: Type[BaseModel] = Field(description="Model for config")
    input: Type[BaseModel] = Field(description="Model for run input")
    output: Type[BaseModel] = Field(description="Model for run output")

    create_fn: Callable[[BaseModel, "Context"], Awaitable[Agent]] = Field(exclude=True)

    model_config = ConfigDict(extra="allow")

from typing import Awaitable, Callable, Type

from pydantic import BaseModel, ConfigDict, Field

from acp.server.highlevel.context import Context


class Agent(BaseModel):
    """Internal agent info."""

    name: str = Field(description="Name of the agent")
    description: str | None = Field(description="Description of what the agent does")

    input: Type[BaseModel] = Field(description="Model for input")
    output: Type[BaseModel] = Field(description="Model for output")

    run_fn: Callable[[BaseModel, "Context"], Awaitable[BaseModel]] = Field(exclude=True)
    destroy_fn: Callable[["Context"], Awaitable[None]] | None = Field(exclude=True)

    model_config = ConfigDict(extra="allow")

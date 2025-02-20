from pydantic import BaseModel, ConfigDict


class Config(BaseModel):
    tools: list[str] | None = None


class Input(BaseModel):
    config: Config | None = None


class Output(BaseModel):
    model_config = ConfigDict(extra="allow")

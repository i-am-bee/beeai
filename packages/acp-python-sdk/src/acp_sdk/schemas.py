from pydantic import BaseModel


class Config(BaseModel, extra="allow"):
    pass


class Input(BaseModel, extra="allow"):
    text: str


class Output(BaseModel, extra="allow"):
    text: str

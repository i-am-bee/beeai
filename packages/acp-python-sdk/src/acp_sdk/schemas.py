from pydantic import BaseModel


class Input(BaseModel, extra="allow"):
    text: str


class Output(BaseModel, extra="allow"):
    text: str

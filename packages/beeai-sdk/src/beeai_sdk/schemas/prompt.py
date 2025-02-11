from pydantic import BaseModel


class PromptInput(BaseModel):
    prompt: str


class PromptOutput(BaseModel):
    text: str

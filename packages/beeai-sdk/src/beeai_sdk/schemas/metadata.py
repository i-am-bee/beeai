from typing import Optional
from pydantic import BaseModel, ConfigDict


class Metadata(BaseModel):
    title: Optional[str] = None
    fullDescription: Optional[str] = None
    framework: Optional[str] = None
    licence: Optional[str] = None
    avgRunTimeSeconds: Optional[float] = None
    avgRunTokens: Optional[float] = None
    tags: Optional[list[str]] = None
    ui: Optional[str] = None

    model_config = ConfigDict(extra="allow")

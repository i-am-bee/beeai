from typing import Optional
from pydantic import BaseModel, ConfigDict


class Metadata(BaseModel):
    tags: Optional[list[str]] = None

    model_config = ConfigDict(extra="allow")

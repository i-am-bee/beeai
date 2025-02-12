from typing import Any
from pydantic import BaseModel


class Config(BaseModel):
    """Base class for configuration models, enforces flat structure with string values"""

    @classmethod
    def __pydantic_init_subclass__(cls, **kwargs: Any) -> None:
        super().__pydantic_init_subclass__(**kwargs)
        for field_name, field_info in cls.model_fields.items():
            if field_info.annotation is not str:
                raise ValueError(f"Type {field_info.annotation} of field {field_name} is not allowed.")

import os

from pydantic_settings import BaseSettings


class Configuration(BaseSettings):
    llm_model: str = "llama3.1"
    llm_api_base: str = "https://localhost:11434/v1"
    llm_api_key: str = "dummy"
    google_api_key: str | None = None
    google_search_engine_id: str | None = None


def load_env():
    for name, var in Configuration().model_dump().items():
        if var:
            os.environ.setdefault(name.upper(), var)

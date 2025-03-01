import os

from pydantic_settings import BaseSettings


class Configuration(BaseSettings):
    model: str = "ollama/llama3.1"
    api_base: str = "http://localhost:11434/v1"
    openai_api_key: str | None = None
    google_api_key: str | None = None
    google_search_engine_id: str | None = None


def load_env():
    for name, var in Configuration().model_dump().items():
        if var:
            os.environ.setdefault(name.upper(), var)

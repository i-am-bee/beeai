import os

from pydantic_settings import BaseSettings


class Configuration(BaseSettings):
    llm_model: str = "gpt-4o"
    llm_api_base: str = "https://api.openai.com/v1"
    llm_api_key: str | None = None


def load_env():
    config = Configuration()
    os.environ.setdefault("MODEL", config.llm_model)
    os.environ.setdefault("API_BASE", config.llm_api_base)
    os.environ.setdefault("OPENAI_API_KEY", config.llm_api_key)

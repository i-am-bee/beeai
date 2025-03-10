import os

from pydantic_settings import BaseSettings


class Configuration(BaseSettings):
    llm_model: str = "gpt-4o"
    llm_api_base: str = "https://api.openai.com/v1"
    llm_api_key: str


def load_env():
    config = Configuration()
    os.environ.setdefault("MODEL", config.model)
    os.environ.setdefault("API_BASE", config.api_base)
    os.environ.setdefault("OPENAI_API_KEY", config.api_key)

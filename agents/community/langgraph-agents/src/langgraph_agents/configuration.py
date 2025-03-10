import os

from pydantic_settings import BaseSettings


class Configuration(BaseSettings):
    llm_model: str = "llama3.1"
    llm_api_base: str = "https://localhost:11434/v1"
    llm_api_key: str = "dummy"


def load_env():
    config = Configuration()
    os.environ.setdefault("MODEL", config.llm_model)
    os.environ.setdefault("API_BASE", config.llm_api_base)
    os.environ.setdefault("OPENAI_API_KEY", config.llm_api_key)

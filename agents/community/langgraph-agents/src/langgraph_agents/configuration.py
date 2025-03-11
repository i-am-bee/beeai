import os

from pydantic_settings import BaseSettings


class Configuration(BaseSettings):
    llm_model: str = "llama3.1"
    llm_api_base: str = "http://localhost:11434/v1"
    llm_api_key: str = "dummy"


def load_env():
    config = Configuration()
    os.environ["MODEL"] = config.llm_model
    os.environ["API_BASE"] = config.llm_api_base
    os.environ["OPENAI_API_KEY"] = config.llm_api_key

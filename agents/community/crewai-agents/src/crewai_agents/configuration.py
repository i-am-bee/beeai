import os

from pydantic_settings import BaseSettings


class Configuration(BaseSettings):
    model: str = "ollama/llama3.1"
    api_base: str ="http://localhost:11434"


def load_env():
    for name, var in Configuration().model_dump().items():
        os.environ.setdefault(name.upper(), var)

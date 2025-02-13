import os

from pydantic_settings import BaseSettings


class Configuration(BaseSettings):
    retriever: str = "duckduckgo"
    ollama_base_url: str = "http://localhost:11434"
    fast_llm: str = "ollama:llama3.1"
    smart_llm: str = "ollama:llama3.1"
    strategic: str = "ollama:llama3.1"
    embedding: str = "ollama:nomic-embed-text"


def load_env():
    for name, var in Configuration().model_dump().items():
        os.environ.setdefault(name.upper(), var)

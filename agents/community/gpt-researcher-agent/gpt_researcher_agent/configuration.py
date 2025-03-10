import os

from pydantic_settings import BaseSettings


class Configuration(BaseSettings):
    retriever: str = "duckduckgo"
    llm_api_base: str = "http://localhost:11434/v1"
    llm_api_key: str = "dummy"
    llm_model: str = "llama3.1"
    llm_model_fast: str | None = None
    llm_model_smart: str | None = None
    llm_model_strategic: str | None = None
    embedding: str | None = None


def load_env():
    config = Configuration()
    os.environ["RETRIEVER"] = config.retriever
    os.environ["OPENAI_BASE_URL"] = config.llm_api_base
    os.environ["OPENAI_API_KEY"] = config.llm_api_key
    os.environ["FAST_LLM"] = f"openai:{config.llm_model_fast or config.llm_model}"
    os.environ["SMART_LLM"] = f"openai:{config.llm_model_smart or config.llm_model}"
    os.environ["STRATEGIC_LLM"] = f"openai:{config.llm_model_strategic or config.llm_model}"
    if config.embedding:
        os.environ["EMBEDDING"] = config.embedding

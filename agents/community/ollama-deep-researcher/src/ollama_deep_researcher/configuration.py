import os
from dataclasses import dataclass, fields
from enum import Enum
from typing import Any, Optional

from langchain_core.runnables import RunnableConfig


class SearchAPI(Enum):
    PERPLEXITY = "perplexity"
    TAVILY = "tavily"
    DUCKDUCKGO = "duckduckgo"


@dataclass(kw_only=True)
class Configuration:
    """The configurable fields for the research assistant."""

    llm_model: str = "llama3.1"
    llm_api_base: str = "http://localhost:11434/v1"
    llm_api_key: str = "dummy"

    max_web_research_loops: int = 3
    search_api: SearchAPI = SearchAPI.DUCKDUCKGO
    fetch_full_page: bool = False

    @classmethod
    def from_runnable_config(cls, config: Optional[RunnableConfig] = None) -> "Configuration":
        """Create a Configuration instance from a RunnableConfig."""
        configurable = config["configurable"] if config and "configurable" in config else {}
        values: dict[str, Any] = {
            f.name: os.environ.get(f.name.upper(), configurable.get(f.name)) for f in fields(cls) if f.init
        }
        return cls(**{k: v for k, v in values.items() if v})


def load_env():
    config = Configuration()
    os.environ["MODEL"] = config.llm_model
    os.environ["API_BASE"] = config.llm_api_base
    os.environ["OPENAI_API_KEY"] = config.llm_api_key

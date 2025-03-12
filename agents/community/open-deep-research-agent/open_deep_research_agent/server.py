import argparse
import asyncio
import os
import threading

from typing import Any

from acp.server.highlevel import Server
from beeai_sdk.providers.agent import run_agent_provider
from beeai_sdk.schemas.base import Log
from beeai_sdk.schemas.metadata import Metadata, UiDefinition, UiType
from beeai_sdk.schemas.text import TextInput, TextOutput

from pydantic import Field
from dotenv import load_dotenv
from huggingface_hub import login
from open_deep_research_agent.scripts.text_inspector_tool import TextInspectorTool
from open_deep_research_agent.scripts.text_web_browser import (
    ArchiveSearchTool,
    FinderTool,
    FindNextTool,
    PageDownTool,
    PageUpTool,
    SimpleTextBrowser,
    VisitTool,
)
from open_deep_research_agent.scripts.visual_qa import visualizer

from smolagents import (
    CodeAgent,
    GoogleSearchTool,
    # HfApiModel,
    LiteLLMModel,
    ToolCallingAgent,
)


AUTHORIZED_IMPORTS = [
    "requests",
    "zipfile",
    "os",
    "pandas",
    "numpy",
    "sympy",
    "json",
    "bs4",
    "pubchempy",
    "xml",
    "yahoo_finance",
    "Bio",
    "sklearn",
    "scipy",
    "pydub",
    "io",
    "PIL",
    "chess",
    "PyPDF2",
    "pptx",
    "torch",
    "datetime",
    "fractions",
    "csv",
]
load_dotenv(override=True)
login(os.getenv("HF_TOKEN"))

append_answer_lock = threading.Lock()


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "question",
        type=str,
        help="for example: 'How many studio albums did Mercedes Sosa release before 2007?'",
    )
    parser.add_argument("--model-id", type=str, default="o1")
    return parser.parse_args()


custom_role_conversions = {"tool-call": "assistant", "tool-response": "user"}

user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0"

BROWSER_CONFIG = {
    "viewport_size": 1024 * 5,
    "downloads_folder": "downloads_folder",
    "request_kwargs": {
        "headers": {"User-Agent": user_agent},
        "timeout": 300,
    },
    "serpapi_key": os.getenv("SERPAPI_API_KEY"),
}

os.makedirs(f"./{BROWSER_CONFIG['downloads_folder']}", exist_ok=True)


def create_agent():
    model_id = os.getenv("LLM_MODEL_ID", "ollama/llama3.1")
    model_params = {
        "api_base": os.getenv("LLM_API_BASE", "http://localhost:11434"),
        "api_key": os.getenv("LLM_API_KEY", ""),
        "model_id": model_id,
        "custom_role_conversions": custom_role_conversions,
        # "max_completion_tokens": 8192,
    }
    if model_id == "o1":
        model_params["reasoning_effort"] = "high"
    model = LiteLLMModel(**model_params)

    text_limit = 100000
    browser = SimpleTextBrowser(**BROWSER_CONFIG)
    WEB_TOOLS = [
        GoogleSearchTool(provider="serper"),
        VisitTool(browser),
        PageUpTool(browser),
        PageDownTool(browser),
        FinderTool(browser),
        FindNextTool(browser),
        ArchiveSearchTool(browser),
        TextInspectorTool(model, text_limit),
    ]
    text_webbrowser_agent = ToolCallingAgent(
        model=model,
        tools=WEB_TOOLS,
        max_steps=20,
        verbosity_level=2,
        planning_interval=4,
        name="search_agent",
        description="""A team member that will search the internet to answer your question.
    Ask him for all your questions that require browsing the web.
    Provide him as much context as possible, in particular if you need to search on a specific timeframe!
    And don't hesitate to provide him with a complex search task, like finding a difference between two webpages.
    Your request must be a real sentence, not a google search! Like "Find me this information (...)" rather than a few keywords.
    """,
        provide_run_summary=True,
    )
    text_webbrowser_agent.prompt_templates["managed_agent"][
        "task"
    ] += """You can navigate to .txt online files.
    If a non-html page is in another format, especially .pdf or a Youtube video, use tool 'inspect_file_as_text' to inspect it.
    Additionally, if after some searching you find out that you need more information to answer the question, you can use `final_answer` with your request for clarification as argument to request for more information."""

    manager_agent = CodeAgent(
        model=model,
        tools=[visualizer, TextInspectorTool(model, text_limit)],
        max_steps=12,
        verbosity_level=2,
        additional_authorized_imports=AUTHORIZED_IMPORTS,
        planning_interval=4,
        managed_agents=[text_webbrowser_agent],
    )

    return manager_agent


agentName = "open-deep-research"

exampleInputText = "How many Bob Dylan albums were released before 1967?"

fullDescription = f"""
This agent is an open implementation of OpenAI's Deep Research.

## Example Usage

#### CLI:
```bash
beeai run {agentName} "{exampleInputText}"
```
"""


class Output(TextOutput):
    text: str = Field(default_factory=str)


async def register_agent() -> int:
    server = Server("open-deep-research-agent")

    @server.agent(
        agentName,
        "Some text",
        input=TextInput,
        output=TextOutput,
        **Metadata(
            framework="Custom",
            license="Apache 2.0",
            languages=["Python"],
            githubUrl="https://github.com/i-am-bee/beeai/tree/main/agents/community/open-deep-research-agent",
            ui=UiDefinition(
                type=UiType.hands_off,
                userGreeting="What topic do you want to research?",
            ),
            exampleInput=exampleInputText,
            fullDescription=fullDescription,
        ).model_dump(),
    )
    async def run_agent(input: TextInput, ctx) -> TextOutput:
        agent = create_agent()
        async for message in agent.run(input.text):
            await ctx.report_agent_run_progress(Output(text=message.content))

        return Output(text=agent.final_result)

    await run_agent_provider(server)
    return 0


def main():
    asyncio.run(register_agent())


if __name__ == "__main__":
    main()

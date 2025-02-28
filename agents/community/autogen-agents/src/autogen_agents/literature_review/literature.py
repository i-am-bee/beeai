from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.conditions import TextMentionTermination
from autogen_agentchat.teams import RoundRobinGroupChat
from autogen_core.tools import FunctionTool
from autogen_ext.models.openai import OpenAIChatCompletionClient


def arxiv_search(query: str, max_results: int = 2) -> list:  # type: ignore[type-arg]
    """
    Search Arxiv for papers and return the results including abstracts.
    """
    import arxiv

    client = arxiv.Client()
    search = arxiv.Search(
        query=query, max_results=max_results, sort_by=arxiv.SortCriterion.Relevance
    )

    results = []
    for paper in client.results(search):
        results.append(
            {
                "title": paper.title,
                "authors": [author.name for author in paper.authors],
                "published": paper.published.strftime("%Y-%m-%d"),
                "abstract": paper.summary,
                "pdf_url": paper.pdf_url,
            }
        )

    return results


arxiv_search_tool = FunctionTool(
    arxiv_search,
    description="Search Arxiv for papers related to a given topic, including abstracts",
)

arxiv_search_agent = AssistantAgent(
    name="Arxiv_Search_Agent",
    tools=[arxiv_search_tool],
    model_client=OpenAIChatCompletionClient(
        model="llama3.1:latest",
        base_url="http://localhost:11434/v1",
        api_key="placeholder",
        model_info={
            "vision": False,
            "function_calling": True,
            "json_output": False,
            "family": "unknown",
        },
    ),
    description="An agent that can search Arxiv for papers related to a given topic, including abstracts",
    system_message="You are a helpful AI assistant. Solve tasks using your tools. Specifically, you can take into consideration the user's request and craft a search query that is most likely to return relevant academi papers.",
)


report_agent = AssistantAgent(
    name="Report_Agent",
    model_client=OpenAIChatCompletionClient(
        model="llama3.1:latest",
        base_url="http://localhost:11434/v1",
        api_key="placeholder",
        model_info={
            "vision": False,
            "function_calling": True,
            "json_output": False,
            "family": "unknown",
        },
    ),
    description="Generate a report based on a given topic",
    system_message="You are a helpful assistant. Your task is to synthesize data extracted into a high quality literature review including CORRECT references. You MUST write a final report that is formatted as a literature review with CORRECT references.  Your response should end with the word 'TERMINATE'",
)

termination = TextMentionTermination("TERMINATE")
team = RoundRobinGroupChat(
    participants=[arxiv_search_agent, report_agent],
    termination_condition=termination,
)

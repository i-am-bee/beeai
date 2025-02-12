from typing import Any
import asyncio
from gpt_researcher import GPTResearcher
from mcp.server.fastmcp import FastMCP
from dotenv import load_dotenv
load_dotenv()
from beeai_sdk.schemas.prompt import PromptInput, PromptOutput
from beeai_sdk.providers.agent import run_agent_provider
    
class Output(PromptOutput):
    type: None | str = None
    content: None | str = None
    text: None | str = None
    metadata: None | Any = None
    
class CustomLogsHandler:
    def __init__(self, send_progress):
        self.send_progress = send_progress
        
    async def send_json(self, data: dict[str, Any]) -> None:
        delta = Output(type=data.get('type'),content=data.get('content'),text=data.get('output'),metadata=data.get('metadata'))
        await self.send_progress(delta)


async def register_agent() -> int:

    server = FastMCP("researcher-agent")
    
    @server.agent("GPT-researcher", 
                  "GPT Researcher is an autonomous agent designed for comprehensive web and local research on any given task.", 
                  input=PromptInput, 
                  output=Output)
    async def run_agent(input: PromptInput, ctx) -> Output:

        async def send_progress(delta: Output):
            await ctx.report_agent_run_progress(delta)
            
        custom_logs_handler = CustomLogsHandler(send_progress)
        
        researcher = GPTResearcher(query=input.prompt, report_type="research_report", websocket=custom_logs_handler)
        # Conduct research on the given query
        await researcher.conduct_research()
        # Write the report
        report = await researcher.write_report()
        return Output(type='result',text=report)
    
    await run_agent_provider(server)

    return 0

def main():
    asyncio.run(register_agent())

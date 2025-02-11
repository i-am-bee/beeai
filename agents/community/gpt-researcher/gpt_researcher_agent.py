from typing import Any
from gpt_researcher import GPTResearcher
from mcp.server.fastmcp import FastMCP
import mcp.types as types
from dotenv import load_dotenv
load_dotenv()
from beeai_sdk.schemas.prompt import PromptInput, PromptOutput
    
class CustomLogsHandler:
    def __init__(self, send_progress):
        self.send_progress = send_progress
        
    async def send_json(self, data: dict[str, Any]) -> None:
        await self.send_progress(data)


def main() -> int:

    server = FastMCP("researcher-agent")
    
    @server.agent("GPT-researcher", 
                  "GPT Researcher is an autonomous agent designed for comprehensive web and local research on any given task.", 
                  input=PromptInput, 
                  output=PromptOutput)
    async def run_agent(input: PromptInput, ctx) -> PromptOutput:

        async def send_progress(text: str):
            await ctx.report_agent_run_progress(text)
            
        custom_logs_handler = CustomLogsHandler(send_progress)
        
        researcher = GPTResearcher(query=input.prompt, report_type="research_report", websocket=custom_logs_handler)
        # Conduct research on the given query
        await researcher.conduct_research()
        # Write the report
        report = await researcher.write_report()
        return PromptOutput(text=report)
    
    server.run('sse')

    return 0

if __name__ == '__main__':
    main()

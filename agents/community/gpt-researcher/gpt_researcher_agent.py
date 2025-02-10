from gpt_researcher import GPTResearcher
from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel
from dotenv import load_dotenv
load_dotenv()

class Input(BaseModel):
    prompt: str

class Output(BaseModel):
    text: str
    
def main() -> int:
    print("Starting server")
    
    server = FastMCP("researcher-agent")
    
    @server.agent("GPT-researcher", "GPT Researcher is an autonomous agent designed for comprehensive web and local research on any given task.", input=Input, output=Output)
    async def run_agent(input: Input, ctx) -> Output:
        print("Running agent")
        researcher = GPTResearcher(query=input.prompt, report_type="research_report")
        # Conduct research on the given query
        research_result = await researcher.conduct_research()
        print(research_result)
        # Write the report
        report = await researcher.write_report()
        print(report)
        return Output(text=report)
    
    server.run('sse')

    return 0

if __name__ == '__main__':
    main()

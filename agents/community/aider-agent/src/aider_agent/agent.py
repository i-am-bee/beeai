import asyncio
import io
import subprocess
import os
import sys
import tempfile
from pathlib import Path

from pydantic import Field
from acp.server.highlevel import Server
from beeai_sdk.schemas.text import TextInput, TextOutput
from beeai_sdk.providers.agent import run_agent_provider
from beeai_sdk.schemas.metadata import Metadata, Examples, CliExample, UiDefinition, UiType


class Output(TextOutput):
    files: dict[str, str] = Field(default_factory=dict)
    text: str = Field(default_factory=str)


agentName = "aider"
examples = Examples(
    cli=[
        CliExample(
            command=f'beeai run {agentName} "Make a program that asks for a number and prints its factorial"',
            processingSteps=[
                "The agent is triggered with the natural language input",
                "It executes the `aider` command in a temporary directory with specified options",
                "Captures the standard output and error streams, updating the user with progress",
                "Reads and returns the content of any generated or modified files",
            ],
        )
    ]
)

fullDescription = """
> ℹ️ NOTE
> 
> This agent works in stateless mode at the moment. While the CLI only shows the textual output, the created files are also available through the API.

The agent is an advanced AI pair programming assistant designed to help developers edit and manage code in their local git repositories via natural language instructions. It leverages AI to assist programmers in writing, editing, debugging, and understanding code, enhancing productivity and simplifying complex coding tasks. The agent runs in a local environment and interacts directly with the user's codebase, providing actionable insights and modifications.

## How It Works
The agent operates as a server-based application that listens for programming-related commands. Upon receiving a command in natural language, it executes the appropriate actions within a temporary directory, simulating changes and returning feedback to the user. The agent uses subprocess execution to run the `aider` command with various options, capturing both standard output and errors to provide detailed responses. It also reads files generated during the process to include their content in the output if applicable.

## Input Parameters
The agent requires the following input parameters:
- **input** (string) – The prompt containing natural language instructions for code editing or management.

## Output Structure
The agent returns an `Output` object with the following fields:
- **files** (dict) – A dictionary mapping file paths to their respective content, representing any new or modified files.
- **text** (str) – A string containing the text output from the executed commands, including any error messages.

## Key Features
- **Natural Language Processing** – Understands and executes code-related commands described in natural language.
- **Local Environment Integration** – Operates directly within the user's local environment, simulating changes in a temporary workspace.
- **Real-Time Feedback** – Provides continuous updates on the execution progress and returns detailed results.
- **Error Handling** – Captures and reports errors encountered during execution, assisting with debugging.

## Use Cases
- **Program Generation from Natural Language** – Converts user requests into fully functional programs.
- **Code Editing and Refactoring** – Assists developers in modifying existing codebases without manual intervention.
- **Debugging Support** – Provides insights and suggestions for resolving coding errors or inefficiencies.
- **Collaborative Programming** – Simulates a pair programming experience, enhancing coding efficiency and learning.
- **Bash/Shell Scripting Assistance** – Automates script writing, optimization, and debugging.
"""


async def register_agent() -> int:
    server = Server("aider-agent")

    @server.agent(
        agentName,
        "An AI pair programmer that edits code in a local Git repository using natural language, executing commands and providing feedback.",
        input=TextInput,
        output=Output,
        **Metadata(
            framework="Custom",
            license="Apache 2.0",
            languages=["Python"],
            githubUrl="https://github.com/i-am-bee/beeai/tree/main/agents/community/aider-agent",
            examples=examples,
            ui=UiDefinition(type=UiType.hands_off, userGreeting="Define your programming task."),
            fullDescription=fullDescription,
            avgRunTimeSeconds=5.0,
            avgRunTokens=5000,
        ).model_dump(),
    )
    async def run_agent(input: TextInput, ctx) -> Output:
        output: Output = Output()
        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            try:
                env = os.environ.copy()
                env["OPENAI_API_KEY"] = env.get("LLM_API_KEY", "dummy")
                env["OPENAI_API_BASE"] = env.get("LLM_API_BASE", "http://localhost:11434/v1")
                env["AIDER_MODEL"] = f"openai/{env.get('LLM_MODEL', 'llama3.1')}"
                process = await asyncio.create_subprocess_exec(
                    sys.executable,
                    "-m",
                    "aider",
                    "--yes",
                    "--no-auto-commits",
                    "--no-git",
                    "--no-pretty",
                    "--no-analytics",
                    "--no-restore-chat-history",
                    "--no-show-model-warnings",
                    "--no-show-release-notes",
                    "--no-detect-urls",
                    "--no-auto-lint",
                    "--no-auto-test",
                    "--no-check-update",
                    "--message",
                    input.text,
                    cwd=tmp_dir,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    env=env,
                )

                binary_buffer = io.BytesIO()
                string_reader = io.TextIOWrapper(buffer=binary_buffer, encoding="utf-8")
                while True:
                    chunk = await process.stdout.read(1024)
                    if not chunk:
                        break
                    binary_buffer_position = binary_buffer.tell()
                    binary_buffer.write(chunk)
                    binary_buffer.seek(binary_buffer_position)
                    text_chunk = string_reader.read()
                    output.text += text_chunk
                    await ctx.report_agent_run_progress(Output(text=text_chunk))

                stderr = await process.stderr.read()
                await process.wait()

                if process.returncode != 0:
                    error_text = stderr.decode() if stderr else "Unknown error occurred"
                    output.text += f"\nError: {error_text}"
                    return output

                for file_path in tmp_path.rglob("*"):
                    if any(part in ["node_modules", ".venv"] or part.startswith(".aider.") for part in file_path.parts):
                        continue
                    if file_path.is_file():
                        try:
                            content = file_path.read_text()
                            relative_path = str(file_path.relative_to(tmp_path))
                            output.files[relative_path] = content
                        except Exception as e:
                            output.text = f"Error reading file {relative_path}: {str(e)}"

            except Exception as e:
                output.text = f"Error: {str(e)}"

        return output

    await run_agent_provider(server)

    return 0


def main():
    asyncio.run(register_agent())


if __name__ == "__main__":
    main()

import asyncio
import io
import subprocess
import os
import sys
import tempfile
from pathlib import Path

from pydantic import Field
from acp.server.highlevel import Server
from beeai_sdk.schemas.prompt import PromptInput, PromptOutput
from beeai_sdk.providers.agent import run_agent_provider
from beeai_sdk.schemas.metadata import Metadata


class Output(PromptOutput):
    files: dict[str, str] = Field(default_factory=dict)
    text: str = Field(default_factory=str)


async def register_agent() -> int:
    server = Server("aider-agent")

    @server.agent(
        "aider",
        "AI pair programming assistant that helps you edit code in your local git repository using natural language.",
        input=PromptInput,
        output=Output,
        **Metadata(
            framework="Custom",
            license="Apache 2.0",
            languages=["Python"],
            githubUrl="https://github.com/i-am-bee/beeai/tree/main/agents/community/aider-agent",
            avgRunTimeSeconds=5.0,
            avgRunTokens=5000,
            fullDescription="""Aider is an AI pair programming assistant that helps you write simple programs.""",
        ).model_dump(),
    )
    async def run_agent(input: PromptInput, ctx) -> Output:
        output: Output = Output()
        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            try:
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
                    "--message",
                    input.prompt,
                    cwd=tmp_dir,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    env=os.environ.copy(),
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
                    if any(part in [".aider", "node_modules", ".venv"] for part in file_path.parts):
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

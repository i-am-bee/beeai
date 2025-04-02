import asyncio
import io
import subprocess
import os
import sys
import tempfile
from pathlib import Path

from pydantic import Field
from beeai_sdk.schemas.text import TextInput, TextOutput
from beeai_sdk.providers.agent import Server, Context


class Output(TextOutput):
    files: dict[str, str] = Field(default_factory=dict)
    text: str = Field(default_factory=str)


server = Server("aider-agent")


@server.agent()
async def run_agent(input: TextInput, ctx: Context) -> Output:
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

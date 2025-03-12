# Copyright 2025 IBM Corp.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from pathlib import Path
from typing import Optional

import typer

from beeai_cli.async_typer import AsyncTyper
from beeai_cli.commands.agent import run_agent

app = AsyncTyper()


@app.command("sequential")
async def sequential(
    dump_files: Optional[Path] = typer.Option(None, help="Folder path to save any files returned by the agent"),
) -> None:
    """Compose agents into a sequential workflow."""
    await run_agent(name="sequential-workflow", input=None, dump_files=dump_files)

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


import typer

from beeai_cli.api import api_request
from beeai_cli.async_typer import AsyncTyper, console

app = AsyncTyper()


@app.command("sharing")
async def sharing(disable: bool | None = typer.Option(None, help="Disable sharing")):
    """Read and update telemetry sharing configuration."""
    if disable is not None:
        await api_request("put", "telemetry", {"sharing_enabled": not disable})
    config = await api_request("get", "telemetry")
    console.print(config)

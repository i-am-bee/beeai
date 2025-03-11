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
from rich.table import Column

from beeai_cli.api import api_request
from beeai_cli.async_typer import AsyncTyper, console, create_table
from beeai_cli.utils import parse_env_var

app = AsyncTyper()


@app.command("add")
async def add(
    env: list[str] = typer.Argument(help="Environment variables to pass to provider"),
) -> None:
    """Store environment variables"""
    env_vars = [parse_env_var(var) for var in env]
    env_vars = {name: value for name, value in env_vars}
    await api_request(
        "put",
        "env",
        json={**({"env": env_vars} if env_vars else {})},
    )
    await list_env()


@app.command("list")
async def list_env():
    """List stored environment variables"""
    # TODO: extract server schemas to a separate package
    resp = await api_request("get", "env")
    with create_table(Column("name", style="yellow"), "value") as table:
        for name, value in sorted(resp["env"].items()):
            table.add_row(name, value)
    console.print(table)


@app.command("remove")
async def remove_env(
    env: list[str] = typer.Argument(help="Environment variable(s) to remove"),
):
    await api_request("put", "env", json={**({"env": {var: None for var in env}})})
    await list_env()


@app.command(
    "sync", help="Sync external changes to provider registry (if you modified ~/.beeai/providers.yaml manually)"
)
async def sync():
    """Sync external changes to env configuration (if you modified ~/.beeai/.env manually)"""
    await api_request("put", "env/sync")
    console.print("Env updated")


@app.command("check", help="Check if LLM env vars are set correctly")
async def check():
    required_vars = ["LLM_API_BASE", "LLM_API_KEY", "LLM_MODEL"]

    env_vars = (await api_request("get", "env")).get("env", {})

    statuses = {
        var: {
            "status": "missing" if var not in env_vars else "unknown",
            "value": "Not set" if var not in env_vars else env_vars[var],
        }
        for var in required_vars
    }

    missing_vars = [var for var in required_vars if var not in env_vars]
    if missing_vars:
        console.print("[bold red]Error:[/bold red] The following required environment variables are not set:")
        for var in missing_vars:
            console.print(f"  - [yellow]{var}[/yellow]")
        console.print("\nPlease set these variables using the [bold]beeai env add[/bold] command.")
        console.print(
            "See documentation for details: https://docs.beeai.dev/get-started/installation#set-up-agent-providers"
        )
        print_var_statuses(statuses)
        return

    api_base, api_key, model = [env_vars[var] for var in required_vars]
    try:
        import httpx

        headers = {"Authorization": f"Bearer {api_key}"}
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{api_base}/models", headers=headers, timeout=10.0)
        if response.status_code in (401, 403):
            statuses["LLM_API_BASE"]["status"] = "good"
            statuses["LLM_API_KEY"]["status"] = "bad"
            console.print("[bold red]Error:[/bold red] API key was rejected. Please check your LLM_API_KEY.")
        elif not response.is_success:
            statuses["LLM_API_BASE"]["status"] = "bad"
            if "11434" in api_base:
                console.print(
                    "[bold red]Error:[/bold red] Failed to connect to Ollama. Ensure that the Ollama service is running and reachable."
                )
            else:
                console.print("[bold red]Error:[/bold red] Failed to connect to the LLM API. Is the URL correct?")
        else:
            statuses["LLM_API_BASE"]["status"] = "good"
            statuses["LLM_API_KEY"]["status"] = "good"

            available_models = [m.get("id", "") for m in response.json().get("data", [])]

            if model not in available_models:
                statuses["LLM_MODEL"]["status"] = "bad"
                console.print(f"[bold red]Error:[/bold red] Model '{model}' not found in available models.")
                console.print(
                    "Available models:",
                    ", ".join(available_models[:100])
                    + (f"... and {len(available_models) - 100} more" if len(available_models) > 100 else ""),
                )
            else:
                statuses["LLM_MODEL"]["status"] = "good"
                console.print("[bold green]Success![/bold green] LLM environment is correctly configured.")

    except httpx.ConnectError:
        statuses["LLM_API_BASE"]["status"] = "bad"
        console.print(f"[bold red]Error:[/bold red] Could not connect to {api_base}")
        if "11434" in api_base:
            console.print(
                "[bold red]Error:[/bold red] Ollama appears to be not running or unreachable. Check that the service is active."
            )
        else:
            console.print("[bold red]Error:[/bold red] Please check if the URL is correct and the service is running.")
    except httpx.TimeoutException:
        statuses["LLM_API_BASE"]["status"] = "bad"
        console.print(f"[bold red]Error:[/bold red] Connection to {api_base} timed out.")
    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] An unexpected error occurred: {str(e)}")

    print_var_statuses(statuses)


def print_var_statuses(statuses):
    """Print the status of environment variables with appropriate formatting."""
    status_formats = {
        "good": {"symbol": "✓", "color": "green"},
        "bad": {"symbol": "✗", "color": "red"},
        "unknown": {"symbol": "?", "color": "yellow"},
        "missing": {"symbol": "∅", "color": "blue"},
    }

    for var in ["LLM_API_BASE", "LLM_API_KEY", "LLM_MODEL"]:
        if var in statuses:
            status = statuses[var]["status"]
            fmt = status_formats[status]
            console.print(f"[{fmt['color']}]{fmt['symbol']} {var}: {statuses[var]['value']}[/{fmt['color']}]")

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

import asyncio
import functools
import inspect
from contextlib import contextmanager
from typing import Iterator

import rich.text
import typer
from httpx import ConnectError
from rich.console import Console, RenderResult
from rich.markdown import Heading, Markdown
from rich.table import Table

from beeai_cli.api import resolve_connection_error
from beeai_cli.configuration import Configuration
from beeai_cli.utils import extract_messages

DEBUG = Configuration().debug

err_console = Console(stderr=True)
console = Console()


class _LeftAlignedHeading(Heading):
    def __rich_console__(self, *args, **kwargs) -> RenderResult:
        for elem in super().__rich_console__(*args, **kwargs):
            if isinstance(elem, rich.text.Text):
                elem.justify = "left"
            yield elem


Markdown.elements["heading_open"] = _LeftAlignedHeading


@contextmanager
def create_table(*args, no_wrap: bool = True, **kwargs) -> Iterator[Table]:
    table = Table(*args, **kwargs, box=None, pad_edge=False, width=console.width, show_header=True)
    yield table
    for column in table.columns:
        column.no_wrap = no_wrap
        column.overflow = "ellipsis"
        column.header = column.header.upper()

    if not table.rows:
        table._render = lambda *args, **kwargs: [rich.text.Text("<No items found>", style="italic")]


class AsyncTyper(typer.Typer):
    def command(self, *args, **kwargs):
        parent_decorator = super().command(*args, **kwargs)

        def decorator(f):
            @functools.wraps(f)
            def wrapped_f(*args, **kwargs):
                try:
                    for retries in range(2):
                        try:
                            if inspect.iscoroutinefunction(f):
                                return asyncio.run(f(*args, **kwargs))
                            else:
                                return f(*args, **kwargs)
                        except* (ConnectionError, ConnectError):
                            resolve_connection_error(retried=retries > 0)
                except* Exception as ex:
                    for exc_type, message in extract_messages(ex):
                        err_console.print(f":boom: [bold red]{exc_type}[/bold red]: {message}")
                        if exc_type == "McpError":
                            err_console.print(
                                "💡 [yellow]HINT[/yellow]: Is your configuration correct? Try re-entering your LLM API details with: [green]beeai env setup[/green]"
                            )
                    if DEBUG:
                        raise

            parent_decorator(wrapped_f)
            return f

        return decorator

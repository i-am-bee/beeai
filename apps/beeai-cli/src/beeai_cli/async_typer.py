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
import functools
import inspect
import asyncio

from rich.console import Console

from beeai_cli.configuration import Configuration
from beeai_cli.utils import extract_messages

DEBUG = Configuration().debug

err_console = Console(stderr=True)
console = Console()


class AsyncTyper(typer.Typer):
    def command(self, *args, **kwargs):
        parent_decorator = super().command(*args, **kwargs)

        def decorator(f):
            @functools.wraps(f)
            def wrapped_f(*args, **kwargs):
                try:
                    if inspect.iscoroutinefunction(f):
                        asyncio.run(f(*args, **kwargs))
                    else:
                        f(*args, **kwargs)
                except Exception as ex:
                    for exc_type, message in extract_messages(ex):
                        err_console.print(f":boom: [bold red]{exc_type}[/bold red]: {message}")
                    if DEBUG:
                        raise

            parent_decorator(wrapped_f)
            return f

        return decorator

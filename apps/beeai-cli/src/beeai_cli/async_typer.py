import typer
import functools
import inspect
import asyncio

from rich.console import Console

from beeai_cli.configuration import Configuration
from beeai_cli.utils import extract_messages

DEBUG = Configuration().debug

err_console = Console(stderr=True)


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

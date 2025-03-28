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

import logging
import asyncio
from csv import Error
import functools
import hashlib
import inspect
import os
from pathlib import Path
import sys
import requests
from functools import partial

import anyio.to_thread
import yaml
from typing import Any, Callable, Coroutine, ParamSpec, TypeVar
from beeai_sdk.schemas.base import Output, Input
from acp.server.highlevel import Context

from acp.server.highlevel.agents import Agent
import anyio
from opentelemetry import trace
from opentelemetry.sdk.resources import Resource, SERVICE_NAME, SERVICE_NAMESPACE
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, SpanExportResult
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from acp.server.highlevel import Server as ACPServer

AGENT_FILE_NAME = "agent.yaml"
logger = logging.getLogger(__name__)

P = ParamSpec("P")
T = TypeVar("T")


def syncify(async_func: Callable[P, Coroutine[Any, Any, T]]) -> Callable[P, T]:
    """
    Converts an async function to a sync function.
    """

    @functools.wraps(async_func)
    def sync_wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        return loop.run_until_complete(async_func(*args, **kwargs))

    return sync_wrapper


def syncify_object_dynamic(ctx: Context):
    """
    Dynamically converts all async methods of a object to sync methods.
    """
    for name, method in inspect.getmembers(ctx):
        if inspect.iscoroutinefunction(method):
            object.__setattr__(ctx, name, syncify(method))

    return ctx


class SilentOTLPSpanExporter(OTLPSpanExporter):
    def export(self, spans):
        try:
            return super().export(spans)
        except Exception as e:
            logger.warning(f"OpenTelemetry Exporter failed silently: {e}")
            return SpanExportResult.FAILURE


class Server:
    _agent: Agent = None
    _manifest: dict[str, Any] = {}

    def __init__(self, name: str | None = None):
        self.server = ACPServer(name or "beeai")
        self.decorated = False

    def __call__(self):
        if not self._agent:
            logger.warning("Running empty server. To add an agent, anotate function with @server.agent()")
            return

        try:
            asyncio.run(self.run_agent_provider())
        except KeyboardInterrupt:
            return
        except Exception as e:
            logger.error(f"Error occured {e}")

    def agent(self) -> Callable:
        """Decorator to register an agent."""
        if self.decorated:
            raise Error("Agent decorator already used")
        self.decorated = True

        logger.debug("Registering agent function")

        def decorator(fn: Callable) -> Callable:
            def generator_wrapper(input: Input, ctx: Context):
                last_value = None
                sync_ctx = syncify_object_dynamic(ctx)
                for value in fn(input):
                    last_value = value
                    sync_ctx.report_agent_run_progress(value)
                return last_value

            async def async_generator_wrapper(input: Input, ctx: Context):
                last_value = None
                async for value in fn(input):
                    last_value = value
                    await ctx.report_agent_run_progress(value)
                else:
                    return last_value

            if inspect.isgeneratorfunction(fn):
                if len(inspect.signature(fn).parameters.keys()) != 1:
                    raise TypeError("The agent generator function must have one 'input' argument")
                func = generator_wrapper
            elif inspect.isasyncgenfunction(fn):
                if len(inspect.signature(fn).parameters.keys()) != 1:
                    raise TypeError("The agent generator function must have one 'input' argument")
                func = async_generator_wrapper
            else:
                func = fn

            signature = inspect.signature(func)
            parameters = list(signature.parameters.values())

            if len(parameters) == 0:
                raise TypeError("The agent function must have at least 'input' argument")
            if len(parameters) > 2:
                raise TypeError("The agent function must have only 'input' and 'ctx' arguments")
            if len(parameters) == 2 and parameters[1].name != "ctx":
                raise TypeError("The second argument of the agent function must be 'ctx'")

            input = parameters[0].annotation
            output = signature.return_annotation

            def create_agent_name_from_path():
                """Create an agent name from the current path"""
                cwd = sys.modules["__main__"].__file__
                hash_object = hashlib.md5(cwd.encode())
                return hash_object.hexdigest()

            self._manifest = self.read_agent_manifest()

            name = self._manifest.get("name") or create_agent_name_from_path()

            @functools.wraps(func)
            async def sync_fn(*args, **kwargs):
                ctx = syncify_object_dynamic(kwargs["ctx"])
                return await anyio.to_thread.run_sync(partial(func, ctx=ctx) if len(parameters) == 2 else func, *args)

            @functools.wraps(func)
            async def async_fn(*args, **kwargs):
                return await func(*args, **kwargs) if len(parameters) == 2 else await func(*args)

            if not output:
                logger.warning("Output schema not specified, return type should be provided.")

            self._agent = Agent(
                name=name,
                description=self._manifest.get("description"),
                input=input,
                output=output if output is not inspect.Signature.empty else Output,
                run_fn=(async_fn if inspect.iscoroutinefunction(func) else sync_fn),
                destroy_fn=None,
            )
            self.server.add_agent(agent=self._agent)
            logger.info(f"Agent with name '{name}' created")
            return func

        return decorator

    def read_agent_manifest(self):
        """Reads agent manifest file from the standard path"""

        def read_file(path: str):
            try:
                with open(path, "r", encoding="utf-8") as file:
                    return file.read()
            except FileNotFoundError:
                return False
            except Exception as e:
                raise Error("Agent file read error") from e

        file_content = read_file(
            os.path.join(
                Path(os.path.dirname(sys.modules["__main__"].__file__)).parent.parent,
                AGENT_FILE_NAME,
            )
        ) or read_file(os.path.join(os.getcwd(), AGENT_FILE_NAME))
        if not file_content:
            logger.warning("Agent file not found")
        else:
            return yaml.safe_load(file_content)

    async def run_agent_provider(self):
        async def find_free_port():
            """Get a random free port assigned by the OS."""
            listener = await anyio.create_tcp_listener()
            port = listener.extra(anyio.abc.SocketAttribute.local_address)[1]
            await listener.aclose()
            return port

        self.server.settings.host = os.getenv("HOST", "127.0.0.1")
        self.server.settings.port = int(os.getenv("PORT", await find_free_port()))
        trace.set_tracer_provider(
            tracer_provider=TracerProvider(
                resource=Resource(
                    attributes={
                        SERVICE_NAME: self.server.name,
                        SERVICE_NAMESPACE: "beeai-agent-provider",
                    }
                ),
                active_span_processor=BatchSpanProcessor(SilentOTLPSpanExporter()),
            )
        )
        with trace.get_tracer("beeai-sdk").start_as_current_span("agent-provider"):
            try:
                server_task = asyncio.create_task(self.server.run_sse_async(timeout_graceful_shutdown=5))
                await asyncio.sleep(0.5)
                callback_task = asyncio.create_task(self.register_agent())
                await asyncio.gather(server_task, callback_task)
            except KeyboardInterrupt:
                pass

    async def register_agent(self):
        if os.getenv("PRODUCTION_MODE", False):
            logger.debug("Agent is not automatically registered in the production mode.")
            return

        request_data = {
            "location": f"http://{self.server.settings.host}:{self.server.settings.port}",
            "id": self._agent.name,
            "manifest": self._manifest or {"name": self._agent.name},
        }
        try:
            url = os.getenv("PLATFORM_URL", "http://127.0.0.1:8333")
            response = requests.post(
                f"{url}/api/v1/provider/register/unmanaged",
                json=request_data,
            )
            response.raise_for_status()
            result = response.json()
            print(result)
            logger.info("Agent registered to the beeai server.")
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                logger.warning(f"Server not found. Agent can not be registered. Check if server is running on {url}")
            else:
                logger.warning(f"Agent can not be registered to beeai server: {e}")
        except Exception as e:
            logger.warning(f"Agent can not be registered to beeai server: {e}")


__all__ = ["Context", "Server"]

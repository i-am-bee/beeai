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
import requests

import anyio.to_thread
import yaml
from typing import Any, Callable, Coroutine, ParamSpec, TypeVar
from beeai_sdk.schemas.base import Output
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


P = ParamSpec("P")
T = TypeVar("T")


def syncify(async_func: Callable[P, Coroutine[Any, Any, T]]) -> Callable[P, T]:
    """
    Converts an async function to a sync function.
    """

    def sync_wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        return loop.run_until_complete(async_func(*args, **kwargs))

    sync_wrapper.__name__ = async_func.__name__
    sync_wrapper.__doc__ = async_func.__doc__
    return sync_wrapper


def syncify_class_dynamic(cls: type) -> type:
    """
    Dynamically converts all async methods of a class to sync methods.
    """
    new_cls_dict = {}
    for name, method in inspect.getmembers(cls):
        if inspect.iscoroutinefunction(method):
            new_cls_dict[name] = syncify(method)
        else:
            new_cls_dict[name] = method

    return type(cls.__name__, cls.__bases__, new_cls_dict)


class SilentOTLPSpanExporter(OTLPSpanExporter):
    def export(self, spans):
        try:
            return super().export(spans)
        except Exception as e:
            logging.debug(f"OpenTelemetry Exporter failed silently: {e}")
            return SpanExportResult.FAILURE


class Server:
    _agent: Agent
    _manifest: dict[str, Any]

    def agent(self) -> Callable:
        """Decorator to register an agent."""
        if self.decorated:
            raise Error("Agent decorator already used")
        self.decorated = True

        def decorator(func: Callable) -> Callable:
            signature = inspect.signature(func)
            parameters = list(signature.parameters.values())
            first_parameter = parameters[0]
            input = first_parameter.annotation
            output = signature.return_annotation

            if not input:
                raise TypeError("The agent function must have at least one argument")

            def create_agent_name_from_path():
                """Create an agent name from the current path"""
                cwd = os.getcwd()
                hash_object = hashlib.md5(cwd.encode())
                return hash_object.hexdigest()

            self._manifest = self.read_agent_file()

            name = self._manifest.get("name") or create_agent_name_from_path()

            func_with_context = func if len(parameters) == 2 else lambda input, ctx: func(input)

            @functools.wraps(func_with_context)
            async def fn(*args, **kwargs):
                # TODO fix
                SyncContext = syncify_class_dynamic(Context)
                # print(inspect.getsource(SyncContext))
                print(SyncContext)
                y = list(args)
                y[1] = SyncContext
                args = tuple(y)
                return await anyio.to_thread.run_sync(func_with_context, *args, **kwargs)

            self._agent = Agent(
                name=name,
                description=self._manifest.get("name"),
                input=input,
                output=output if output is not inspect.Signature.empty else Output,
                run_fn=(func_with_context if inspect.iscoroutinefunction(func_with_context) else fn),
                destroy_fn=None,
            )
            self.server.add_agent(agent=self._agent)
            logging.info(f"Agent with name '{name}' created")
            return func

        return decorator

    def read_agent_file(self):
        """Reads file from the standard path"""

        def read_file(path: str):
            try:
                with open(path, "r", encoding="utf-8") as file:
                    return file.read()
            except FileNotFoundError:
                return False
            except Exception as e:
                raise Error("Agent file read error") from e

        file_content = read_file(os.path.join(os.getcwd(), AGENT_FILE_NAME)) or read_file(
            os.path.dirname(os.path.abspath(__file__)), AGENT_FILE_NAME
        )
        if not file_content:
            logging.warning("Warn: agent file not found")
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

                async def register_agent():
                    data = {
                        "url": f"{self.server.settings.host}:{self.server.settings.port}",
                        "id": self._agent.name,
                        "manifest": {
                            "manifestVersion": self._manifest.get("manifestVersion"),
                            "name": self._agent.name,
                        },
                    }
                    try:
                        url = os.getenv("BEEAI_SERVER_URL", "http://127.0.0.1:8333")
                        response = requests.post(
                            f"{url}/v1/provider/register/unmanaged",
                            json=data,
                        )
                        response.raise_for_status()
                        result = response.json()
                        print(result)
                        logging.info("Agent registered to the beeai server.")
                    except requests.exceptions.HTTPError as e:
                        if e.response.status_code == 404:
                            logging.warning(
                                f"Server not found. Agent can not be registered. Check if server is running on {url}"
                            )
                        else:
                            logging.warning(f"Agent can not be registered to beeai server: {e}")
                    except Exception as e:
                        logging.warning(f"Agent can not be registered to beeai server: {e}")

                server_task = asyncio.create_task(self.server.run_sse_async(timeout_graceful_shutdown=5))
                await asyncio.sleep(0.5)
                callback_task = asyncio.create_task(register_agent())
                await asyncio.gather(server_task, callback_task)
            except KeyboardInterrupt:
                pass

    def __init__(self, name: str | None = None):
        self.server = ACPServer(name or "beeai")
        self.decorated = False

    def __call__(self):
        try:
            asyncio.run(self.run_agent_provider())
        except KeyboardInterrupt:
            return
        except Exception as e:
            logging.error(f"Error occured {e}")

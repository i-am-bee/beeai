# Copyright 2025 © BeeAI a Series of LF Projects, LLC
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
import logging
from asyncio import CancelledError
from contextlib import AsyncExitStack, asynccontextmanager
from typing import AsyncGenerator

from beeai_server.configuration import Configuration
from beeai_server.adapters.interface import IContainerBackend, ITelemetryRepository, TelemetryConfig
from beeai_server.telemetry import OTEL_HTTP_PORT
from beeai_server.utils.docker import DockerImageID
from beeai_server.utils.logs_container import LogsContainer, ProcessLogMessage
from kink import inject
from pydantic import BaseModel

from beeai_server.utils.utils import cancel_task

logger = logging.getLogger(__name__)


class TelemetryCollector(BaseModel, extra="allow"):
    config: TelemetryConfig

    @asynccontextmanager
    @inject
    async def run(
        self, container_backend: IContainerBackend, configuration: Configuration
    ) -> AsyncGenerator[..., None]:
        logs_container = LogsContainer()
        config_dir = configuration.telemetry_config_dir

        def handle_log(message: ProcessLogMessage):
            logger.info(message.message, extra={"container_name": "beeai-otelcol-contrib"})

        try:
            logs_container.subscribe(handle_log)

            image = DockerImageID(root="otel/opentelemetry-collector-contrib:0.122.1")
            await container_backend.pull_image(image=image, logs_container=logs_container)
            async with container_backend.open_container(
                image=image,
                name="beeai-otelcol-contrib",
                command=[
                    "--config",
                    "/base.yaml",
                    *(["--config", "/beeai.yaml"] if self.config.sharing_enabled else []),
                    "--set",
                    f"receivers::otlp::protocols::http::endpoint=0.0.0.0:{OTEL_HTTP_PORT}",
                ],
                port_mappings={OTEL_HTTP_PORT: OTEL_HTTP_PORT},
                volumes=[f"{config_dir / 'base.yaml'}:/base.yaml", f"{config_dir / 'beeai.yaml'}:/beeai.yaml"],
                restart="on-failure:10",
                logs_container=logs_container,
            ) as container_id:
                yield container_id
        finally:
            logs_container.unsubscribe(handle_log)


@inject
class TelemetryCollectorManager:
    def __init__(self, repository: ITelemetryRepository):
        self._repository = repository
        self._collector = None
        self._collector_exit_stack = AsyncExitStack()
        self._start_task = None

    async def __aenter__(self):
        logger.info("Starting collector")
        await self.reload()

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self._stop_collector()
        logger.info("Collector stopped")

    async def _restart_collector(self, config: TelemetryConfig):
        try:
            await self._stop_collector()

            async def start_collector():
                self._collector = TelemetryCollector(config=config)
                await self._collector_exit_stack.enter_async_context(self._collector.run())

            self._start_task = asyncio.create_task(start_collector())
            await self._start_task
        except CancelledError:
            pass
        except BaseException as ex:
            logger.warning(f"Exception occurred during collector start: {ex!r}")
        finally:
            self._start_task = None

    async def _stop_collector(self):
        try:
            if self._start_task:
                await cancel_task(self._start_task)
            await self._collector_exit_stack.aclose()
        except BaseException as ex:
            logger.warning(f"Exception occurred when stopping collector: {ex!r}")
            self._collector_exit_stack.pop_all()
        self._collector = None

    async def reload(self, force: bool = False):
        config = await self._repository.get()
        if self._collector and self._collector.config == config and not force:
            return
        await self._restart_collector(config)

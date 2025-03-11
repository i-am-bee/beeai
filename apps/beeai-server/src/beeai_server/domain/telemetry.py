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

import abc
import asyncio
from asyncio.subprocess import Process
from contextlib import AsyncExitStack, asynccontextmanager
from datetime import timedelta
import logging
import pathlib
from typing import AsyncGenerator

import anyio
from beeai_server.adapters.interface import ITelemetryRepository, TelemetryConfig
from beeai_server.telemetry import OTEL_HTTP_PORT
from beeai_server.utils.managed_telemetry_collector import (
    ManagedTelemetryCollectorParameters,
    managed_telemetry_collector,
)
from beeai_server.utils.periodic import Periodic
from kink import inject
from pydantic import BaseModel


logger = logging.getLogger(__name__)


class BaseCollector(BaseModel, abc.ABC):
    @abc.abstractmethod
    async def check_compatibility(self) -> None:
        pass

    @abc.abstractmethod
    async def run(self) -> AsyncGenerator[Process, None]:
        pass


class ManagedTelemetryCollector(BaseCollector, abc.ABC):
    config: TelemetryConfig


class SystemBinaryTelemetryCollector(ManagedTelemetryCollector):
    async def check_compatibility(self) -> None:
        await super().check_compatibility()

    @asynccontextmanager
    async def run(self) -> AsyncGenerator[Process, None]:
        await self.check_compatibility()
        config_dir = pathlib.Path(__file__).parent.joinpath("collector")
        async with managed_telemetry_collector(
            params=ManagedTelemetryCollectorParameters(
                command="otelcol-contrib",
                args=["--config", str(config_dir / "base.yaml")]
                + (["--config", str(config_dir / "beeai.yaml")] if self.config.sharing_enabled else [])
                + ["--set", f"receivers::otlp::protocols::http::endpoint=0.0.0.0:{OTEL_HTTP_PORT}"],
            )
        ) as process:
            yield process


class TelemetryCollector(BaseModel, extra="allow"):
    implementation: SystemBinaryTelemetryCollector

    @asynccontextmanager
    async def run(self):
        async with self.implementation.run() as process:
            yield process


@inject
class TelemetryCollectorManager:
    _collector_process: Process | None = None

    def __init__(self, repository: ITelemetryRepository):
        self._repository = repository
        self._collector = None
        self._collector_exit_stack = AsyncExitStack()
        self._stopping = False
        self._stopped = asyncio.Event()
        self._ensure_collector_periodic = Periodic(
            executor=self._ensure_collector,
            period=timedelta(minutes=1),
            name="Ensure collector",
        )

    async def __aenter__(self):
        self._stopping = False
        logger.info("Starting collector")
        await self._ensure_collector_periodic.start()

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        self._stopping = True
        self._ensure_collector_periodic.poke()
        await self._stopped.wait()
        await self._ensure_collector_periodic.stop()
        logger.info("Collector stopped")

    async def _ensure_collector(self):
        if self._stopping:
            await self._stop_collector()
            self._stopped.set()
            return

        config = await self._repository.get()
        if (
            self._collector_process
            and self._collector_process.returncode is None
            and self._collector.implementation.config.model_dump() == config.model_dump()
        ):
            return

        try:
            await self._start_collector()
        except Exception as ex:
            logger.warning(f"Exception occurred when stopping collector: {ex!r}")
            self._collector_process = None

    async def _start_collector(self):
        await self._stop_collector()
        config = await self._repository.get()
        self._collector = TelemetryCollector(
            implementation=SystemBinaryTelemetryCollector(config=config),
        )
        self._collector_process = await self._collector_exit_stack.enter_async_context(
            self._collector.implementation.run()
        )
        tg = await self._collector_exit_stack.enter_async_context(anyio.create_task_group())
        self._collector_exit_stack.callback(lambda: tg.cancel_scope.cancel())

    async def _stop_collector(self):
        try:
            await self._collector_exit_stack.aclose()
        except Exception as ex:
            logger.warning(f"Exception occurred when stopping collector: {ex!r}")
            self._collector_exit_stack.pop_all()
        self._collector = None

    async def force_update(self):
        self._ensure_collector_periodic.poke()

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
import contextlib
import logging
import pathlib
from contextlib import asynccontextmanager
from typing import Iterable

from beeai_server.domain.model import LoadedProviderStatus
from fastapi import FastAPI, APIRouter
from fastapi import HTTPException
from fastapi.exception_handlers import http_exception_handler
from fastapi.responses import ORJSONResponse
from fastapi.staticfiles import StaticFiles
from kink import inject, di
from starlette.responses import FileResponse
from starlette.status import HTTP_500_INTERNAL_SERVER_ERROR
from opentelemetry.metrics import get_meter, Observation, CallbackOptions

from beeai_server.telemetry import INSTRUMENTATION_NAME, shutdown_telemetry
from beeai_server.domain.telemetry import TelemetryCollectorManager
from beeai_server.bootstrap import bootstrap_dependencies
from beeai_server.configuration import Configuration
from beeai_server.exceptions import ManifestLoadError
from beeai_server.routes.mcp_sse import create_mcp_sse_app
from beeai_server.routes.provider import router as provider_router
from beeai_server.routes.agent import router as agent_router
from beeai_server.routes.env import router as env_router
from beeai_server.routes.telemetry import router as telemetry_router
from beeai_server.services.mcp_proxy.provider import ProviderContainer
from beeai_server.utils.periodic import CRON_REGISTRY, run_all_crons

logger = logging.getLogger(__name__)


def extract_messages(exc):
    if isinstance(exc, BaseExceptionGroup):
        return [(exc_type, msg) for e in exc.exceptions for exc_type, msg in extract_messages(e)]
    else:
        return [(type(exc).__name__, str(exc))]


def register_global_exception_handlers(app: FastAPI):
    @app.exception_handler(ManifestLoadError)
    async def entity_not_found_exception_handler(request, exc: ManifestLoadError):
        return await http_exception_handler(request, HTTPException(status_code=exc.status_code, detail=str(exc)))

    @app.exception_handler(Exception)
    async def custom_http_exception_handler(request, exc):
        """Include detail in all unhandled exceptions.

        This is not the beset security practice as it can reveal details about the internal workings of this service,
        but this is an open-source service anyway, so the risk is acceptable
        """
        logger.error("Error during HTTP request: %s", repr(extract_messages(exc)))
        return await http_exception_handler(
            request, HTTPException(status_code=HTTP_500_INTERNAL_SERVER_ERROR, detail=repr(extract_messages(exc)))
        )


def mount_routes(app: FastAPI):
    static_directory = pathlib.Path(__file__).parent.joinpath("static")
    if not static_directory.joinpath("index.html").exists():  # this check is for running locally
        raise RuntimeError("Could not find static files -- ensure that beeai-ui is built: `mise build:beeai-ui`")

    ui_app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
    ui_app.mount("/", StaticFiles(directory=static_directory, html=True))
    ui_app.add_exception_handler(404, lambda _req, _exc: FileResponse(static_directory / "index.html", status_code=200))

    server_router = APIRouter()
    server_router.include_router(agent_router, prefix="/agent", tags=["agent"])
    server_router.include_router(provider_router, prefix="/provider", tags=["provider"])
    server_router.include_router(env_router, prefix="/env", tags=["env"])
    server_router.include_router(telemetry_router, prefix="/telemetry", tags=["telemetry"])

    app.mount("/healthcheck", lambda: "OK")
    app.mount("/mcp", create_mcp_sse_app())
    app.include_router(server_router, prefix="/api/v1", tags=["provider"])
    app.mount("/", ui_app)


@inject
def register_telemetry(provider_container: ProviderContainer):
    meter = get_meter(INSTRUMENTATION_NAME)

    def scrape_platform_status(options: CallbackOptions) -> Iterable[Observation]:
        yield Observation(value=1)

    meter.create_observable_gauge("platform_status", callbacks=[scrape_platform_status])

    def scrape_providers_by_status(options: CallbackOptions) -> Iterable[Observation]:
        providers = provider_container.loaded_providers
        for status in LoadedProviderStatus:
            count = 0
            for provider in providers:
                if provider.status == status:
                    count += 1
            yield Observation(
                value=count,
                attributes={
                    "status": status,
                },
            )

    meter.create_observable_gauge("providers_by_status", callbacks=[scrape_providers_by_status])


@asynccontextmanager
@inject
async def lifespan(
    _app: FastAPI, provider_container: ProviderContainer, telemetry_collector_manager: TelemetryCollectorManager
):
    register_telemetry()
    async with provider_container, telemetry_collector_manager, run_all_crons():
        yield
    shutdown_telemetry()


@contextlib.asynccontextmanager
async def _run_all_crons():
    try:
        await asyncio.gather(*(cron.start() for cron in CRON_REGISTRY.values()))
        yield
    finally:
        await asyncio.gather(*(cron.stop() for cron in CRON_REGISTRY.values()))


def app() -> FastAPI:
    """Entrypoint for API application, called by Uvicorn"""

    logger.info("Bootstrapping dependencies...")
    bootstrap_dependencies()
    configuration = di[Configuration]

    app = FastAPI(
        lifespan=lifespan,
        default_response_class=ORJSONResponse,  # better performance then default + handle NaN floats
        docs_url="/api/v1/docs",
        openapi_url="/api/v1/openapi.json",
        servers=[{"url": f"http://localhost:{configuration.port}"}],
    )

    logger.info("Mounting routes...")
    mount_routes(app)
    register_global_exception_handlers(app)
    return app

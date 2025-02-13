import logging
import pathlib

from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.exception_handlers import http_exception_handler
from fastapi.responses import ORJSONResponse
from fastapi.staticfiles import StaticFiles
from kink import di
from starlette.responses import RedirectResponse
from starlette.status import HTTP_500_INTERNAL_SERVER_ERROR

from beeai_server.bootstrap import bootstrap_dependencies
from beeai_server.exceptions import ManifestLoadError
from beeai_server.routes.mcp_sse import create_mcp_sse_app
from beeai_server.routes.provider import router as provider_router
from beeai_server.services.mcp_proxy.proxy_server import MCPProxyServer

logger = logging.getLogger(__name__)


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
        logger.error("Error during HTTP request: %s", exc)
        return await http_exception_handler(
            request, HTTPException(status_code=HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))
        )


def mount_routes(app: FastAPI):
    static_directory = pathlib.Path(__file__).parent.joinpath("static")
    if not static_directory.joinpath("index.html").exists():  # this check is for running locally
        raise RuntimeError("Could not find static files -- ensure that beeai-ui is built: `mise build:beeai-ui`")

    ui_app = FastAPI()
    ui_app.mount("/", StaticFiles(directory=static_directory, html=True))
    ui_app.add_exception_handler(404, lambda _req, _exc: RedirectResponse(url="/index.html"))

    server_app = FastAPI()
    server_app.include_router(provider_router, prefix="/provider", tags=["provider"])

    app.mount("/healthcheck", lambda: "OK")
    app.mount("/mcp", create_mcp_sse_app())
    app.mount("/api/v1", server_app)
    app.mount("/", ui_app)


def app() -> FastAPI:
    """Entrypoint for API application, called by Uvicorn"""

    logger.info("Bootstrapping dependencies...")
    bootstrap_dependencies()

    app = FastAPI(
        lifespan=lambda _: di[MCPProxyServer],
        default_response_class=ORJSONResponse,  # better performance then default + handle NaN floats
    )

    logger.info("Mounting routes...")
    mount_routes(app)
    register_global_exception_handlers(app)
    return app

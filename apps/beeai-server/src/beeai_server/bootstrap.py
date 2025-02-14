from kink import di
from mcp.server.sse import SseServerTransport

from beeai_server.adapters.filesystem import FilesystemProviderRepository
from beeai_server.adapters.interface import IProviderRepository
from beeai_server.configuration import Configuration, get_configuration
from beeai_server.services.mcp_proxy.provider import ProviderContainer


def bootstrap_dependencies():
    di.clear_cache()
    di._aliases.clear()  # reset aliases
    di[Configuration] = get_configuration()
    di[IProviderRepository] = FilesystemProviderRepository(provider_config_path=di[Configuration].provider_config_path)
    di[SseServerTransport] = SseServerTransport("/mcp/messages/")  # global SSE transport
    di[ProviderContainer] = ProviderContainer(di[IProviderRepository])

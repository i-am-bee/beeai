import logging
from datetime import timedelta

from kink import inject

from beeai_server.services.provider import ProviderService
from beeai_server.utils.periodic import periodic

logger = logging.getLogger(__name__)


@periodic(period=timedelta(minutes=1))
@inject
async def reload_providers(provider_service: ProviderService):
    """
    Periodically reload providers from provider repository.

    Runs at server start to initialize the providers and then every minute to sync any modifications to the provider
    registry (by default a configuration file at ~/.beeai/providers.yaml).
    """
    await provider_service.sync()

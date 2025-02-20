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

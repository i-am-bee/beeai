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

from typing import TYPE_CHECKING

from starlette.status import HTTP_404_NOT_FOUND


if TYPE_CHECKING:
    from beeai_server.domain.model import EnvVar


class ManifestLoadError(Exception):
    location: str
    status_code: int

    def __init__(self, location: str, message: str | None = None, status_code: int = HTTP_404_NOT_FOUND):
        message = message or f"Manifest at location {location} not found."
        self.status_code = status_code
        super().__init__(message)


class LoadFeaturesError(Exception): ...


class UnsupportedProviderError(FileNotFoundError): ...


class MissingConfigurationError(Exception):
    def __init__(self, missing_env: list["EnvVar"]):
        self.missing_env = missing_env

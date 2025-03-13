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
from functools import cache
from pathlib import Path

from pydantic import BaseModel, field_validator, ValidationError, Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from beeai_server.utils.github import GithubUrl


class LoggingConfiguration(BaseModel):
    level: int = logging.INFO
    level_managed_provider: int = logging.INFO
    level_uvicorn: int = Field(default=logging.FATAL, validate_default=True)

    @model_validator(mode="after")
    def level_uvicorn_validator(self):
        if self.level == logging.DEBUG:
            self.level_uvicorn = logging.WARNING
        return self

    @field_validator("level", "level_uvicorn", "level_managed_provider", mode="before")
    def validate_level(cls, v: str | int | None):
        return v if isinstance(v, int) else logging.getLevelNamesMapping()[v]


class Configuration(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", env_nested_delimiter="__")
    logging: LoggingConfiguration = LoggingConfiguration()
    provider_config_path: Path = Path.home() / ".beeai" / "providers.yaml"
    telemetry_config_path: Path = Path.home() / ".beeai" / "telemetry.yaml"
    env_path: Path = Path.home() / ".beeai" / ".env"
    cache_dir: Path = Path.home() / ".beeai" / "cache"
    port: int = 8333
    collector_port: int = 8335
    provider_registry_location: GithubUrl = "https://github.com/i-am-bee/beeai@registry#path=provider-registry.yaml"


@cache
def get_configuration() -> Configuration:
    """Get cached configuration"""
    try:
        return Configuration()
    except ValidationError as ex:
        from beeai_server.logging_config import configure_logging

        configure_logging(configuration=LoggingConfiguration(level=logging.ERROR))

        logging.error(f"Improperly configured, Error: {ex!r}")
        raise ValueError("Improperly configured, make sure to supply all required variables") from ex

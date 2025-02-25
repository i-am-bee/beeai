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

import functools

import pydantic
import pydantic_settings


@functools.cache
class Configuration(pydantic_settings.BaseSettings):
    model_config = pydantic_settings.SettingsConfigDict(
        env_prefix="BEEAI__",
        env_file_encoding="utf-8",
        env_nested_delimiter="__",
    )
    host: pydantic.AnyUrl = "http://localhost:8333"
    mcp_sse_path: str = "/mcp/sse"
    debug: bool = False

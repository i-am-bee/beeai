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

"""
Configuration package.

This package provides centralized access to configuration settings,
including database connection parameters.
"""

__all__ = ["get_db_url"]

from beeai_server.configuration import get_configuration


def get_db_url() -> str:
    """
    Get the database URL from configuration.

    This function centralizes access to the database URL,
    ensuring consistency across the application and migrations.

    Returns:
        str: The database URL with the correct protocol for the configured database type
    """
    config = get_configuration()

    if config.database.is_postgres():
        return config.database.database_url.replace("postgresql://", "postgresql+asyncpg://")

    return config.database.database_url

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

import logging
from typing import AsyncGenerator, Optional

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from beeai_server.configuration import Configuration

logger = logging.getLogger(__name__)

class Database:
    def __init__(self, configuration: Configuration):
        self.configuration = configuration
        self.engine = None
        self.async_session_factory = None

    async def connect(self) -> None:
        """Connect to the database."""
        # Check if using PostgreSQL database based on URL
        if self.configuration.database.is_postgres():
            logger.info("Connecting to PostgreSQL database...")
            # Use the database URL from the DatabaseConfig
            db_url = self.configuration.database.database_url.replace('postgresql://', 'postgresql+asyncpg://')
            self.engine = create_async_engine(db_url, echo=True)
            self.async_session_factory = async_sessionmaker(
                self.engine, class_=AsyncSession, expire_on_commit=False
            )
            
            # We don't create tables here - this is handled by Alembic migrations
            logger.info("Successfully connected to PostgreSQL database.")
        else:
            logger.info("Not using a SQL database, skipping database connection.")

    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """Get a database session."""
        if not self.async_session_factory:
            raise RuntimeError("Database is not connected. Call connect() first.")
        
        async with self.async_session_factory() as session:
            yield session
            
    async def disconnect(self) -> None:
        """Disconnect from the database."""
        if self.engine:
            await self.engine.dispose()
            logger.info("Disconnected from database.") 

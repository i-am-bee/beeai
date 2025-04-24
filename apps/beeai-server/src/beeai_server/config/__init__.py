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
        return config.database.database_url.replace('postgresql://', 'postgresql+asyncpg://')
    
    return config.database.database_url 

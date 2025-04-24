"""
Database models package.

This package provides a single source of truth for all database models in the application.
It centralizes the SQLAlchemy Base and model definitions to ensure consistency across
the application and database migrations.
"""

from sqlalchemy.ext.declarative import declarative_base

# Create a single declarative base for all models
Base = declarative_base()

# Export the Base class for use in models and migrations
__all__ = ["Base"] 

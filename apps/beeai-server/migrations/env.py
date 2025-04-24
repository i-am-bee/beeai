from beeai_server.models import Base
from beeai_server.configuration import get_configuration

import os
import sys
from logging.config import fileConfig
import logging

from alembic import context
from sqlalchemy import engine_from_config, pool

parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(parent_dir, "src"))

from beeai_server.models.workflow import WorkflowModel  # noqa

config = context.config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("alembic")

try:
    app_config = get_configuration()
    db_url = app_config.database.database_url
    logger.info("Using database URL from application configuration")
except Exception as e:
    logger.warning(f"Could not load application configuration: {e}")
    db_url = os.environ.get("DATABASE_URL", "postgresql://beeai:iambee-dev@localhost:5432/beeai")
    logger.info("Using database URL from environment")

config.set_main_option("sqlalchemy.url", db_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

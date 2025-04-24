# BeeAI Server

The BeeAI server is a FastAPI-based backend providing the core platform services, API endpoints, and agent orchestration.

## Database Migrations

This project uses Alembic for database schema migrations. The migrations are defined in the `migrations` directory.

### Environment Configuration

Database connection is configured via a `.env` file in the root of the `beeai-server` directory. Create this file with the following content:

```
# Database configuration
DATABASE_URL=postgresql://beeai:iambee-dev@localhost:5432/beeai
```

For Docker Compose environments, these values are automatically set via the environment variables in the docker-compose.yml file.

### Running Migrations

To apply all pending migrations:

```bash

# Using tasks 
mise beeai-server:db:migrate
```


The application can be configured with the following environment variables:

- `DATABASE_URL`: The connection string for the database (the URL pattern determines the database type)

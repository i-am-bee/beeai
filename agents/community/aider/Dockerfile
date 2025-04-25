FROM python:3.11-slim-bookworm
COPY --from=ghcr.io/astral-sh/uv:0.6.16 /uv /bin/
WORKDIR /app
COPY . .
RUN uv sync --no-cache --locked --link-mode copy
ENV PRODUCTION_MODE=True
CMD ["uv", "run", "--no-sync", "server"]

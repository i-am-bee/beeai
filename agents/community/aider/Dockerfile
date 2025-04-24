FROM python:3.11-slim-bookworm
COPY --from=ghcr.io/astral-sh/uv:0.6.16 /uv /bin/

ENV UV_LINK_MODE=copy
ENV PRODUCTION_MODE=True

WORKDIR /app
COPY . .

RUN uv sync --frozen

CMD ["uv", "run", "server"]
FROM jdxcode/mise

WORKDIR /app

COPY . .

# Set Mise directories
ENV MISE_CACHE_DIR=/app/.mise
ENV MISE_DATA_DIR=/app/.mise
ENV MISE_STATE_DIR=/app/.mise

# Set UV cache directory
ENV UV_CACHE_DIR=/app/.mise/uv-cache

# Prepare directories and fix permissions during build
RUN mkdir -p /app/.mise /app/.mise/uv-cache && \
    chmod -R 777 /app/.mise && \
    chmod -R 755 /app && \
    mise trust && \
    mise run beeai-server:build

CMD ["mise", "run", "beeai-server:run"]

FROM jdxcode/mise

WORKDIR /app

COPY . .

ENV MISE_CACHE_DIR=/app/.mise
ENV MISE_DATA_DIR=/app/.mise
ENV MISE_STATE_DIR=/app/.mise

RUN mkdir -p /app/.mise && \
    chmod -R 755 /app /app/.mise && \
    mise trust && \
    mise run beeai-server:build

EXPOSE 8333

CMD ["mise", "run", "beeai-server:run"]

FROM jdxcode/mise

WORKDIR /app

COPY . .

ENV MISE_DATA_DIR=/app/.mise-state
ENV MISE_CONFIG_DIR=/app

RUN mkdir -p /app/.mise-state && \
    chmod -R 755 /app /app/.mise-state && \
    mise trust && \
    mise run beeai-server:build

EXPOSE 8333

CMD ["mise", "run", "beeai-server:run"]

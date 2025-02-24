FROM jdxcode/mise

WORKDIR /app

COPY . .
RUN mise trust && mise run beeai-server:build

EXPOSE 8333

CMD ["mise", "run", "beeai-server:run"]

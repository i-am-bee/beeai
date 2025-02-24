FROM jdxcode/mise AS build
WORKDIR /app
COPY . .
# `python.uv_venv_auto` must be `false` to avoid https://github.com/rancher-sandbox/rancher-desktop/issues/8281
RUN mise trust &&\
    mise settings set --local python.uv_venv_auto false &&\
    mise install &&\
    mise run beeai-server:build

FROM debian:12-slim AS runtime
WORKDIR /app
RUN apt-get update  &&\
    apt-get -y --no-install-recommends install \
    build-essential \
    git \
    make \
    nodejs \
    npm \
    pipx \
    python3 \
    python3-dev \
    &&\
    rm -rf /var/lib/apt/lists/*
RUN pipx install uv
COPY --from=build /app/apps/beeai-server/dist/*.tar.gz .
RUN pipx install ./*.tar.gz &&\
    pipx inject beeai-server packaging
RUN chmod og+rx /root
ENV PATH "/root/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
ENV HOME "/tmp"
CMD ["beeai-server"]

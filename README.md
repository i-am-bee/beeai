# BeeAI

## Installation

### Homebrew (recommended)

```sh
brew install i-am-bee/beeai/beeai
brew services start beeai
brew services start arize-phoenix # (optional)
```

The services for `beeai` and `arize-phoenix` will continue to run in the background and restart with your device. Run `brew services list` to see their status.

### `pip` or `pipx`

```sh
pip install beeai-cli # run once to install
beeai serve # keep running in a separate terminal
phoenix serve # (optional) keep running in a separate terminal
```

This variant does not support background services -- the `beeai serve` and `phoenix serve` commands need to be running in a terminal in order to use the platform.

## Development setup

### Installation

This project uses [Mise-en-place](https://mise.jdx.dev/). You **don't need to install any other dependencies** (Python, Node.js, etc.). Simply run:

```sh
brew install mise  # more ways to install: https://mise.jdx.dev/installing-mise.html
mise trust
mise setup
```

### Running the server

```sh
# remove existing providers (due to breaking changes during rapid development)
rm -f ~/.beeai/providers.yaml

# API
mise run:beeai-server
# (keep it running, open another terminal for next steps)
```

### Running the CLI

```sh
# add SSE provider 
mise run:beeai-cli -- provider add mcp http://localhost:9999/sse

# tools
mise run:beeai-cli -- tool list
mise run:beeai-cli -- tool call fetch '{"url": "http://iambee.ai"}'

# agents
mise run:beeai-cli -- agent list
mise run:beeai-cli -- agent run website_summarizer "summarize iambee.ai"
```

### Running the UI

```sh
# run the UI development server:
mise run:beeai-ui

# UI is also available from beeai-server (in static mode):
mise run:beeai-server
```

### Mise shell hooks

To directly access development tools installed by Mise (`python`, `uv`, `node`, etc.), run the following command in your shell. This is recommended to ensure you are using the correct tool versions. It can be made permanent by adding this to your shell's `rc` file.

```sh
# bash (add to ~/.bashrc to make permanent):
eval "$(mise activate bash)"

# zsh (add to ~/.zshrc to make permanent):
eval "$(mise activate zsh)"

# fish (add to ~/.config/fish/config.fish to make permanent):
mise activate fish | source

# other shells: see https://mise.jdx.dev/installing-mise.html#shells
```

### Configuration

Edit `[env]` in `mise.local.toml` in the project root ([documentation](https://mise.jdx.dev/environments/)). Run `mise setup` if you don't see the file.

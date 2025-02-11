# BeeAI

## Installation

### Homebrew (recommended)

```
brew install i-am-bee/beeai/beeai
```

The services for `beeai` and `arize-phoenix` will be automatically set up for you. Run `brew list services` to see their status.

### `pip` or `pipx`

```
pip install beeai-cli
```

This will not automatically set-up services. Keep `beeai serve` running in a separate terminal to use the BeeAI platform. Additionally, if you want to use Arize Phoenix, install it with `pip install arize-phoenix` and keep `phoenix serve` running in a separate terminal.

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
# run example SSE provider
OPENAI_API_KEY=<your-openai-api-key> mise run:example:mcp-simple-agent -- --transport sse --port 9999
# (keep it running, open another terminal for next steps)

# add SSE provider 
mise run:beeai-cli -- provider add mcp http://localhost:9999/sse

# add local filesystem provider
mise run:beeai-cli -- provider add uvx file://packages/mcp-python-sdk/examples/servers/simple-tool
mise run:beeai-cli -- provider list

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

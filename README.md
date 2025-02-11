# BeeAI

## Installation

The BeeAI CLI can be installed through Homebrew (on both Mac and Linux), and also from PyPI.

We **recommend Homebrew** since it supports background service management -- you won't need to keep the server running in a terminal window.

### Homebrew

Install BeeAI CLI with:

```sh
brew install i-am-bee/beeai/beeai # run once to install
brew services start beeai # run once to enable service
```

If you want Arize Phoenix, install it with:

```sh
brew install i-am-bee/beeai/arize-phoenix # run once to install
brew services start arize-phoenix # run once to enable service
```

The services for `beeai` and `arize-phoenix` will continue to run in the background and restart with your device. Run `brew services list` to see their status.

### PyPI

> [!NOTE]
> Since Python stopped supporting global `pip` installations, we recommend using `pipx` -- it can be installed from your OS's package manager. (You may also create a virtual environment and use regular `pip` to install there, but in that case the `beeai` command will only be available in that environment.)

Install BeeAI CLI with:

```sh
pipx install beeai-cli # run once to install
beeai serve # keep running in a separate terminal
```

If you want Arize Phoenix, install it with:

```sh
pipx install arize-phoenix # run once to install
phoenix serve # keep running in a separate terminal
```

This variant does not manage background services -- the `beeai serve` and `phoenix serve` commands need to be kept running in order to use the platform.

---

## Development setup

### Installation

This project uses [Mise-en-place](https://mise.jdx.dev/) as a manager of tool versions (`python`, `uv`, `nodejs`, `pnpm` etc.), as well as a task runner and environment manager. Mise will download all the needed tools automatically -- you don't need to install them yourself.

Clone this project, then run these setup steps:

```sh
brew install mise  # more ways to install: https://mise.jdx.dev/installing-mise.html
mise trust
mise setup
```

After setup, you can use:
- `mise run` to list tasks and select one interactively to run
- `mise <task-name>` to run a task
- `mise x -- <command>` to run a project tool -- for example `mise x -- uv add <package>`

> [!TIP]
> If you want to run tools directly without the `mise x --` prefix, you need to activate a shell hook:
> - Bash: `eval "$(mise activate bash)"` (add to `~/.bashrc` to make permanent)
> - Zsh: `eval "$(mise activate zsh)"` (add to `~/.zshrc` to make permanent)
> - Fish: `mise activate fish | source` (add to `~/.config/fish/config.fish` to make permanent)
> - Other shells: [documentation](https://mise.jdx.dev/installing-mise.html#shells)

### Configuration

Edit `[env]` in `mise.local.toml` in the project root ([documentation](https://mise.jdx.dev/environments/)). Run `mise setup` if you don't see the file.

### Running

To run BeeAI components in development mode (ensuring proper rebuilding), use the following commands.

#### Server

```sh
# remove existing providers (due to breaking changes during rapid development)
rm -f ~/.beeai/providers.yaml

# API
mise run:beeai-server
# (keep it running, open another terminal for next steps)
```

#### CLI

```sh
# add official framework provider 
mise run:beeai-cli -- provider add file://agents/official/bee-agent-framework/beeai-provider.yaml

# tools
mise run:beeai-cli -- tool list
mise run:beeai-cli -- tool call fetch '{"url": "http://iambee.ai"}'

# agents
mise run:beeai-cli -- agent list
mise run:beeai-cli -- agent run website_summarizer "summarize iambee.ai"
```

#### UI

```sh
# run the UI development server:
mise run:beeai-ui

# UI is also available from beeai-server (in static mode):
mise run:beeai-server
```
# BeeAI

##
> [!WARNING]
> [PRE-Alpha] This repository contains the beeai platform which is still under a rapid development. Please treat it as
> highly experimental and expect breaking changes often. Reach out on discord if you'd like to contribute or get 
> involved in the discussions: [join discord](https://discord.gg/AZFrp3UF5k)

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
mise install
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
mise beeai-server:run
# (keep it running, open another terminal for next steps)
```

#### CLI

```sh
# add official framework provider 
mise beeai-cli:run -- provider add file://agents/official/beeai-framework/beeai-provider.yaml

# tools
mise beeai-cli:run -- tool list
mise beeai-cli:run -- tool call fetch '{"url": "http://iambee.ai"}'

# agents
mise beeai-cli:run -- agent list
mise beeai-cli:run -- agent run website_summarizer "summarize iambee.ai"
```

#### UI

```sh
# run the UI development server:
mise beeai-ui:run

# UI is also available from beeai-server (in static mode):
mise beeai-server:run
```

---

## Concepts

### Delta updates of agent output

Agents send updates with `delta`, which is a subset JSON document of their output schema. `delta`s can be combined to obtain the in-progress output object, usually to display it in the UI. The merging algorithm is designed to allow for incremental-only changes in the resulting JSON.

The rules for applying a `delta` to an existing in-progress `output` JSON are, where `output + delta => new_output` denotest the combining operation:
- Different types can't combine (`1 + ["hello"] => ERROR`).
- Numbers combine by addition (`1 + 2 => 3`)
- Strings combine by joining (`"hello" + "there" => "hellothere"`)
- Objects combine by merging and combining values in common keys (`{a: 1, b: "hello"} + {b: "world", c: 2} => {a: 1, b: "helloworld", c: 2}`)
- Combining a value with `null` results in the value (`value + null => value`, `null + value => value`)
- Combining an empty array with a maybe-non-empty array results in the maybe-non-empty array (`array + [] => array`, `[] + array => array`)
    - Exception: When `output` is `[] | null | undefined` and the first element of `delta` is `null`, it is dropped: `[] + [null, "general", "Kenobi"] => ["general", "Kenobi"]` -- this is to ensure that appending to an array can be done without the knowledge of whether the array is currently empty or not
- Non-empty arrays combine by combining the last element of `output` array with the first element of `delta` array, and appending the rest of the elements.
    - `["hello", "there"] + ["general", "Kenobi"] => ["hello", "theregeneral", "Kenobi"]`
    - `["hello", "there"] + [null, "general", "Kenobi"] => ["hello", "there", "general", "Kenobi"]`
    - `[] + ["general", "Kenobi"] => ["general", "Kenobi"]`
    - `[] + [null, "general", "Kenobi"] => ["general", "Kenobi"]`

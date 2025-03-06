> [!WARNING]
> This project is in **Pre-Alpha** and under rapid development. Breaking changes should be expected.

# BeeAI <img align="center" alt="Project Status: Pre-alpha" src="https://img.shields.io/badge/Status-Pre--alpha-blue">

[![License](https://img.shields.io/badge/License-Apache%202.0-EA7826?style=flat)](https://github.com/i-am-bee/beeai?tab=Apache-2.0-1-ov-file#readme)
[![Bluesky](https://img.shields.io/badge/Bluesky-0285FF?style=flat&logo=bluesky&logoColor=white)](https://bsky.app/profile/beeaiagents.bsky.social)
[![Discord](https://img.shields.io/discord/1309202615556378705?style=social&logo=discord&logoColor=black&label=Discord&labelColor=7289da&color=black)](https://discord.com/invite/NradeA6ZNF)
[![GitHub Repo stars](https://img.shields.io/github/stars/I-am-bee/beeai)](https://github.com/i-am-bee/beeai-framework)

Discover, run, and compose AI agents from any provider

## Installation

```sh
brew install i-am-bee/beeai/beeai && brew services start beeai
```

Additional installation methods are available [here](./docs/get-started/installation.mdx).

## Web Interface

Go to `http://localhost:8333` to open the web interface in your browser.

## CLI Usage

To list all available agents:
```sh
beeai list
```

To run a `chat` agent with a given input:
```sh
beeai run chat "Hello"
```

## Agent library

A complete list of reference agent implementations is available at [beeai.dev/agents](https://beeai.dev/agents).
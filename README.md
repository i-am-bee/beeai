<h1 align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/i-am-bee/beeai/master/docs/logo/beeai_logo_white.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/i-am-bee/beeai/master/docs/logo/beeai_logo_black.svg">
    <img alt="BeeAI" src="https://raw.githubusercontent.com/i-am-bee/beeai/master/docs/logo/beeai_logo_black.svg" width="60"><br><br>
  </picture>
  BeeAI
</h1>

<h4 align="center">Discover, run, and compose AI agents from any framework</h4>

<div align="center">

[![Apache 2.0](https://img.shields.io/badge/Apache%202.0-License-EA7826?style=plastic&logo=apache&logoColor=white)](https://github.com/i-am-bee/beeai-framework?tab=Apache-2.0-1-ov-file#readme)
[![Follow on Bluesky](https://img.shields.io/badge/Follow%20on%20Bluesky-0285FF?style=plastic&logo=bluesky&logoColor=white)](https://bsky.app/profile/beeaiagents.bsky.social)
[![Join our Discord](https://img.shields.io/badge/Join%20our%20Discord-7289DA?style=plastic&logo=discord&logoColor=white)](https://discord.com/invite/NradeA6ZNF)
[![LF AI & Data](https://img.shields.io/badge/LF%20AI%20%26%20Data-0072C6?style=plastic&logo=linuxfoundation&logoColor=white)](https://lfaidata.foundation/projects/)

</div>

<p align="center">
    <a href="#key-features">Key features</a> •
    <a href="#quickstart">Quickstart</a> •
    <a href="#documentation">Documentation</a> •
    <a href="#agent-library">Agent library</a>
</p>

<div align="center">

https://github.com/user-attachments/assets/dc6cc4d7-4577-44c9-acf7-ec0133268a2d

</div>

BeeAI is an open platform to help you discover, run, and compose AI agents from any framework and language. Whether building your agents or looking for powerful existing solutions, BeeAI makes it easy to find, connect, and orchestrate AI agents seamlessly.

## Key features

- 🌐 **Framework agnostic**: Integrate AI agents seamlessly, no matter the language or platform.
- ⚙️ **Composition**: Build complex, multi-agent workflows from simple building blocks.
- 🔍 **Discoverability**: Explore a [powerful agent catalog](https://beeai.dev/agents) with integrated search.
- 🐝 **BeeAI ecosystem:** First-class support for [Python](https://github.com/i-am-bee/beeai-framework/tree/main/python) and [TypeScript](https://github.com/i-am-bee/beeai-framework/tree/main/typescript) agent developers via [BeeAI Framework](https://github.com/i-am-bee/beeai-framework).

## Quickstart

1. **Install** BeeAI using [Homebrew](https://brew.sh/) (or see the [installation guide](https://docs.beeai.dev/introduction/installation) for other methods):

```sh
brew install i-am-bee/beeai/beeai
brew services start beeai
```

2. **Configure** LLM provider:

```sh
beeai env setup
```

3. **Launch** the web interface:

```sh
beeai ui
```

4. **Use** from the terminal:

```sh
# List commands
beeai --help

# List all available agents
beeai list

# Run the chat agent
beeai run chat

# Compose agents
beeai compose sequential
```

## Documentation

Visit [docs.beeai.dev](https://docs.beeai.dev) for full documentation.

## Agent library

Visit [beeai.dev/agents](https://beeai.dev/agents) for the list of reference agent implementations.

## Community

The BeeAI community is active on [GitHub Discussions](https://github.com/i-am-bee/beeai/discussions) where you can ask questions, voice ideas, and share your projects.

To chat with other community members, you can join the BeeAI [Discord](https://discord.gg/AZFrp3UF5k) server.

Please note that our [Code of Conduct](./CODE_OF_CONDUCT.md) applies to all BeeAI community channels. We strongly encourage you to read and follow it.

## Maintainers

For information about maintainers, see [MAINTAINERS.md](./MAINTAINERS.md).

## Contributing

Contributions to BeeAI are always welcome and greatly appreciated. Before contributing, please review our [Contribution Guidelines](./CONTRIBUTING.md) to ensure a smooth experience.

Special thanks to our contributors for helping us improve BeeAI.

<a href="https://github.com/i-am-bee/beeai/graphs/contributors">
  <img alt="Contributors list" src="https://contrib.rocks/image?repo=i-am-bee/beeai" />
</a>

## Acknowledgements

Special thanks to the following outstanding projects for their inspiration and influence:

- [Model Context Protocol](https://github.com/modelcontextprotocol)
- [Language Server Protocol](https://github.com/microsoft/language-server-protocol)
- [JSON-RPC](https://www.jsonrpc.org/)
- [Natural Language Interaction Protocol](https://github.com/nlip-project)

---

Developed by contributors to the BeeAI project, this initiative is part of the [Linux Foundation AI & Data program](https://lfaidata.foundation/projects/). Its development follows open, collaborative, and community-driven practices.

<h1 align="center">
  <picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/i-am-bee/beeai/master/docs/logo/beeai_logo_white.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/i-am-bee/beeai/master/docs/logo/beeai_logo_black.svg">
  <img alt="BeeAI" src="https://raw.githubusercontent.com/i-am-bee/beeai/master/docs/logo/beeai_logo_black.svg" width="60">
</picture>
  <br>
  BeeAI
  <br>
</h1>

<h4 align="center">Discover, run, and compose AI agents from any framework</h4>

<p align="center">
    <a href="#key-features">Key Features</a> •
    <a href="#installation">Installation</a> •
    <a href="#how-to-use">How To Use</a> •
    <a href="#documentation">Documentation</a> •
    <a href="#agent-library">Agent Library</a>
</p>

https://github.com/user-attachments/assets/01399875-e92d-428c-82ca-afaca677d185

BeeAI is an open platform designed to help you discover, run, and compose AI agents from any framework and language. Whether you’re building your own agents or looking for powerful existing solutions, BeeAI makes it easy to find, connect, and orchestrate AI agents seamlessly.

**For example, effortlessly combine Deep Research agents with Coding agents to transform research papers directly into working applications.**

## Key Features

- 🌐 Framework Agnostic: Integrate AI agents regardless of language or platform.
- ⚙️ Simple Orchestration: Compose complex workflows from simple building blocks.
- 🔍 Discoverability: Powerful agent catalog with integrated search.

## Installation

```sh
brew install i-am-bee/beeai/beeai
brew services start beeai
```

Additional installation methods are available [here](https://docs.beeai.dev/get-started/installation).

## How To Use

### Web Interface

Launch the BeeAI web interface at http://localhost:8333:

```sh
beeai ui
```

### CLI

To list all available agents:

```sh
beeai list
```

To run a `chat` agent:

```sh
beeai run chat
```

## Documentation

Visit https://docs.beeai.dev to view the full documentation.

## Agent library

A complete list of reference agent implementations is available at [beeai.dev/agents](https://beeai.dev/agents).

## Community

The BeeAI community is active on [GitHub Discussions](https://github.com/i-am-bee/beeai/discussions) where you can ask questions, voice ideas, and share your projects.

To chat with other community members, you can join the BeeAI [Discord](https://discord.gg/AZFrp3UF5k) server.

Do note that our [Code of Conduct](./CODE_OF_CONDUCT.md) applies to all BeeAI community channels. Users are highly encouraged to read and adhere to them to avoid repercussions.

## Contributing

Contributions to BeeAI are welcome and highly appreciated. However, before you jump right into it, we would like you to review our [Contribution Guidelines](./CONTRIBUTING.md) to make sure you have a smooth experience contributing to BeeAI.

Special thanks to our contributors for helping us improve BeeAI.

<a href="https://github.com/i-am-bee/beeai/graphs/contributors">
  <img alt="Contributors list" src="https://contrib.rocks/image?repo=i-am-bee/beeai" />
</a>

## Acknowledgements

A big thank you to these brilliant projects that directly contributed or fueled the inspiration.

- [Model Context Protocol](https://github.com/modelcontextprotocol)
- [Language Server Protocol](https://github.com/microsoft/language-server-protocol)
- [JSON-RPC](https://www.jsonrpc.org/)
- [Natural Language Interaction Protocol](https://github.com/nlip-project)

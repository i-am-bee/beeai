<h1 align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/i-am-bee/beeai/master/docs/logo/beeai_logo_white.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/i-am-bee/beeai/master/docs/logo/beeai_logo_black.svg">
    <img alt="BeeAI" src="https://raw.githubusercontent.com/i-am-bee/beeai/master/docs/logo/beeai_logo_black.svg" width="60"><br><br>
  </picture>
  BeeAI
</h1>

<h4 align="center">Discover, run, and compose AI agents from any framework</h4>

<p align="center">
    <a href="#overview">Overview</a> •
    <a href="#key-features">Key features</a> •
    <a href="#example-use-cases">Example use cases</a> •
    <a href="#getting-started">Getting started</a> •
    <a href="#documentation">Documentation</a> •
    <a href="#agent-library">Agent Library</a>
</p>

<div align="center">

https://github.com/user-attachments/assets/8b945bae-47be-41d6-ae09-49e7b952e403

</div>

## Overview

BeeAI is an open platform designed to help you **discover, run, and compose AI agents** from any framework and language. Whether you’re building your own agents or looking for powerful existing solutions, BeeAI makes it easy to find, connect, and orchestrate AI agents seamlessly.

## Key features

- 🌐 **Framework agnostic**: Integrate AI agents seamlessly, no matter the language or platform.
- ⚙️ **Simple orchestration**: Build complex, multi-step workflows from straightforward building blocks.
- 🔍 **Discoverability**: Explore a [powerful agent catalog](https://beeai.dev/agents) with integrated search.
- 🐝 **BeeAI ecosystem:** First-class support for [Python](https://github.com/i-am-bee/beeai-framework/tree/main/python) and [TypeScript](https://github.com/i-am-bee/beeai-framework/tree/main/typecript) agent developers via [BeeAI Framework](https://github.com/i-am-bee/beeai-framework).

## Example use cases

- 📊 **Competitive analysis:** Combine web research and data analysis agents to transform raw information into insights
- ⚡ **Developer productivity:** Accelerate software development by combining code generation, bug detection, and documentation generator agents
- 🔄 **Workflow automation:** Streamline processes by orchestrating agents into a pipeline
  
---

## Getting started

Get up and running with BeeAI in just a few minutes!  

### Installation

To quickly install and start BeeAI using [Homebrew](https://brew.sh/), run:

```sh
brew install i-am-bee/beeai/beeai && brew services start beeai
```

>[!TIP]
> For all installation options, check the [installation guide](https://docs.beeai.dev/get-started/installation)

### Quick start

BeeAI offers two primary interaction methods to suit different user preferences:

#### 1. Using the Web Interface

1. Open BeeAI in your browser by navigating to http://localhost:8333
2. Browse available agents in the "Agents" tab
3. Explore agent details and capabilities
4. Use the "Compose playground" to create complex agent workflows

#### 2. Using the Command Line Interface

Simple commands to get you started:

```sh
# List all available agents
beeai list

# Run your first agent
beeai run chat "Hi! How are you?"
```

>[!TIP]
> For a list of all commands, run `beeai --help`

---

## Documentation

For complete documentation, visit [docs.beeai.dev](https://docs.beeai.dev).

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

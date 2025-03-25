
# Agents

- [Ollama Deep Researcher](https://github.com/langchain-ai/ollama-deep-researcher)

## Setup

```shell
# Run MCP server
uv run langgraph-agents
```

```shell
# Test MCP server with beeai-cli
env BEEAI__HOST=http://localhost:8000 \
    BEEAI__MCP_SSE_PATH='/sse' \
    uv run beeai agent run ollama-deep-researcher '{"prompt": "hello"}'
```

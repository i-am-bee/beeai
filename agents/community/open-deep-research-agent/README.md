# Open Deep Research

## Agents

[An open replication of OpenAI's Deep Research](https://github.com/huggingface/smolagents/tree/eed0003166e83027eb94ee852bb18cfe2a3b6a4f/examples/open_deep_research) by Hugging Face.

## Usage

Set environmental variables

```bash
mise beeai-cli:run -- env add HF_TOKEN=<token>
mise beeai-cli:run -- env add SERPER_API_KEY=<token>
```

Add provider

```bash
mise beeai-cli:run -- provider add file://agents/community/open-deep-research-agent/beeai-provider.yaml
```

Run agent

```bash
mise beeai-cli:run -- agent run open-deep-research "How many albums did Bob Dylan release before 1970?"
```



## License

This project was originally released under the Apache License 2.0. See the [LICENSE](https://github.com/huggingface/smolagents/blob/eed0003166e83027eb94ee852bb18cfe2a3b6a4f/LICENSE) for details.


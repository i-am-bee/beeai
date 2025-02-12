#!/usr/bin/env npx -y tsx

import { McpServer } from "@agentcommunicationprotocol/sdk/server/mcp.js";

import { StreamlitAgent } from "bee-agent-framework/agents/experimental/streamlit/agent";
import { OllamaChatLLM } from "bee-agent-framework/adapters/ollama/chat";
import { UnconstrainedMemory } from "bee-agent-framework/memory/unconstrainedMemory";
import { Version } from "bee-agent-framework";
import { runAgentProvider } from 'beeai-sdk/src/beeai_sdk/providers/agent.js';
import { promptInputSchema, promptOutputSchema, PromptOutput } from 'beeai-sdk/src/beeai_sdk/schemas/prompt.js';
import { Metadata } from 'beeai-sdk/src/beeai_sdk/schemas/metadata.js';

async function registerAgents(server: McpServer) {
  const streamlitMeta = new StreamlitAgent({
    llm: new OllamaChatLLM(),
    memory: new UnconstrainedMemory(),
  }).meta;
  server.agent(
    streamlitMeta.name,
    streamlitMeta.description,
    promptInputSchema,
    promptOutputSchema,
    async ({
      params: {
        input: { prompt },
        _meta,
      },
    }) => {
      const output = await new StreamlitAgent({
        llm: new OllamaChatLLM(),
        memory: new UnconstrainedMemory(),
      })
        .run({ prompt })
        .observe((emitter) => {
          emitter.on("newToken", async ({ delta }) => {
            if (_meta?.progressToken) {
              await server.server.sendAgentRunProgress({
                progressToken: _meta.progressToken,
                delta: { text: delta } as PromptOutput,
              });
            }
          });
        });
      return {
        text: output.result.raw,
      };
    },
    { tags: ['bee'] } as const satisfies Metadata
  );
}

export async function createServer() {
  const server = new McpServer(
    {
      name: "Bee Agent Framework",
      version: Version,
    },
    {
      capabilities: {
        agents: {},
      },
    }
  );
  await registerAgents(server);
  return server
}

const server = await createServer();
await runAgentProvider(server);

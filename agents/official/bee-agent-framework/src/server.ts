#!/usr/bin/env npx -y tsx@latest

import { AcpServer } from "@i-am-bee/acp-sdk/server/acp.js";

import { BeeAgent } from "bee-agent-framework/agents/bee/agent";
import { OllamaChatModel } from "bee-agent-framework/adapters/ollama/backend/chat";
import { UnconstrainedMemory } from "bee-agent-framework/memory/unconstrainedMemory";
import { Version } from "bee-agent-framework";
import { runAgentProvider } from "@i-am-bee/beeai-sdk/providers/agent";
import { promptInputSchema } from "@i-am-bee/beeai-sdk/schemas/prompt";
import {
  messageInputSchema,
  messageOutputSchema,
  MessageOutput,
} from "@i-am-bee/beeai-sdk/schemas/message";
import { Metadata } from "@i-am-bee/beeai-sdk/schemas/metadata";
import { WikipediaTool } from "bee-agent-framework/tools/search/wikipedia";
import { OpenMeteoTool } from "bee-agent-framework/tools/weather/openMeteo";
import { DuckDuckGoSearchTool } from "bee-agent-framework/tools/search/duckDuckGoSearch";
import { Message } from "bee-agent-framework/backend/message";
import { BaseMemory } from "bee-agent-framework/memory/base";

function createBeeAgent(memory?: BaseMemory) {
  return new BeeAgent({
    llm: new OllamaChatModel("llama3.1"),
    memory: memory ?? new UnconstrainedMemory(),
    tools: [
      new DuckDuckGoSearchTool(),
      new WikipediaTool(),
      new OpenMeteoTool(),
    ],
  });
}

async function registerAgents(server: AcpServer) {
  // Create dummy agent for metadata
  const agent = createBeeAgent();

  // Register agent
  server.agent(
    "bee",
    agent.meta.description,
    messageInputSchema,
    messageOutputSchema,
    async ({
      params: {
        input: { messages },
        _meta,
      },
    }) => {
      const memory = new UnconstrainedMemory();
      memory.addMany(
        messages.map(({ role, content }) => Message.of({ role, text: content }))
      );
      const output = await createBeeAgent(memory)
        .run({ prompt: null })
        .observe((emitter) => {
          emitter.on("partialUpdate", async ({ update }) => {
            if (_meta?.progressToken && update.key === "final_answer") {
              await server.server.sendAgentRunProgress({
                progressToken: _meta.progressToken,
                delta: {
                  messages: [{ role: "assistant", content: update.value }],
                } as MessageOutput,
              });
            }
          });
        });
      return {
        messages: [{ role: "assistant", content: output.result.text }],
      } as MessageOutput;
    },
    {
      title: "Bee Agent",
      framework: "BeeAI",
      licence: "Apache 2.0",
      fullDescription: `This is an example AI agent.
## Features
- Feature 1  
- Feature 2  
- Feature 3`,
      avgRunTimeSeconds: 10,
      avgRunTokens: 48,
      ui: "chat",
    } as const satisfies Metadata
  );

  // Register agent as a tool
  server.tool(
    "bee",
    agent.meta.description,
    promptInputSchema.shape,
    async (args, { signal }) => {
      const output = await createBeeAgent().run(args, { signal });
      return { content: [{ type: "text", text: output.result.text }] };
    }
  );
}

export async function createServer() {
  const server = new AcpServer(
    {
      name: "bee-agent-framework",
      version: Version,
    },
    {
      capabilities: {
        agents: {},
      },
    }
  );
  await registerAgents(server);
  return server;
}

const server = await createServer();
await runAgentProvider(server);

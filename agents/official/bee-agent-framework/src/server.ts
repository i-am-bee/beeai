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
import { z, ZodRawShape } from "zod";

// Definitions

const SupportedTool = {
  Search: "search",
  Wikipedia: "wikipedia",
  Weather: "weather",
} as const;
export type SupportedTools = (typeof SupportedTool)[keyof typeof SupportedTool];

const agentConfigSchema = z
  .object({ tools: z.array(z.nativeEnum(SupportedTool)).optional() })
  .passthrough()
  .optional();

// Factories

function createTool(tool: SupportedTools) {
  switch (tool) {
    case SupportedTool.Search:
      return new DuckDuckGoSearchTool();
    case SupportedTool.Wikipedia:
      return new WikipediaTool();
    case SupportedTool.Weather:
      return new OpenMeteoTool();
  }
}

function createBeeAgent(memory?: BaseMemory, tools?: SupportedTools[]) {
  return new BeeAgent({
    llm: new OllamaChatModel("llama3.1"),
    memory: memory ?? new UnconstrainedMemory(),
    tools: tools?.map(createTool) ?? [],
  });
}

// Registrations

async function registerTools(server: AcpServer) {
  for (const toolName of Object.values(SupportedTool)) {
    const tool = createTool(toolName);
    server.tool(
      toolName,
      tool.description,
      (await tool.inputSchema().shape) as ZodRawShape,
      async (args, { signal }) => {
        const result = await createTool(toolName).run(args as any, { signal });
        return { content: [{ type: "text", text: result.toString() }] };
      }
    );
  }

  // Register agent as a tool
  const agent = createBeeAgent();
  server.tool(
    "bee",
    agent.meta.description,
    promptInputSchema.extend({ config: agentConfigSchema }).shape,
    async ({ config, ...input }, { signal }) => {
      const output = await createBeeAgent(undefined, config?.tools).run(input, {
        signal,
      });
      return { content: [{ type: "text", text: output.result.text }] };
    }
  );
}

async function registerAgents(server: AcpServer) {
  const agent = createBeeAgent();
  server.agent(
    "bee",
    agent.meta.description,
    messageInputSchema.extend({ config: agentConfigSchema }),
    messageOutputSchema,
    async (
      {
        params: {
          input: { messages, config },
          _meta,
        },
      },
      { signal }
    ) => {
      const memory = new UnconstrainedMemory();
      memory.addMany(
        messages.map(({ role, content }) => Message.of({ role, text: content }))
      );
      const output = await createBeeAgent(memory, config?.tools)
        .run({ prompt: null }, { signal })
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
}

// Server

export async function createServer() {
  const server = new AcpServer(
    {
      name: "bee-agent-framework",
      version: Version,
    },
    {
      capabilities: {
        tools: {},
        agents: {},
      },
    }
  );
  await registerTools(server);
  await registerAgents(server);
  return server;
}

const server = await createServer();
await runAgentProvider(server);

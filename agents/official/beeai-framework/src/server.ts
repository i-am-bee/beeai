#!/usr/bin/env npx -y tsx@latest

import { AcpServer } from "@i-am-bee/acp-sdk/server/acp.js";

import { BeeAgent } from "beeai-framework/agents/bee/agent";
import { UnconstrainedMemory } from "beeai-framework/memory/unconstrainedMemory";
import { Version } from "beeai-framework";
import { runAgentProvider } from "@i-am-bee/beeai-sdk/providers/agent";
import { promptInputSchema } from "@i-am-bee/beeai-sdk/schemas/prompt";
import {
  messageInputSchema,
  messageOutputSchema,
  MessageOutput,
} from "@i-am-bee/beeai-sdk/schemas/message";
import { Metadata } from "@i-am-bee/beeai-sdk/schemas/metadata";
import { WikipediaTool } from "beeai-framework/tools/search/wikipedia";
import { OpenMeteoTool } from "beeai-framework/tools/weather/openMeteo";
import { DuckDuckGoSearchTool } from "beeai-framework/tools/search/duckDuckGoSearch";
import { Message } from "beeai-framework/backend/message";
import { BaseMemory } from "beeai-framework/memory/base";
import { z, ZodRawShape } from "zod";
import { agent as contentJudge } from "./content-judge/content-judge.js";
import { agent as podcastCreator } from "./podcast-creator/podcast-creator.js";
import { ChatModel } from "beeai-framework/backend/core";
import { CHAT_MODEL } from "./config.js";

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

async function createBeeAgent(memory?: BaseMemory, tools?: SupportedTools[]) {
  return new BeeAgent({
    llm: await ChatModel.fromName(CHAT_MODEL),
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
  const agent = await createBeeAgent();
  server.tool(
    "chat",
    agent.meta.description,
    promptInputSchema.extend({ config: agentConfigSchema }).shape,
    async ({ config, ...input }, { signal }) => {
      const agent = await createBeeAgent(undefined, config?.tools);
      const output = await agent.run(input, {
        signal,
      });
      return { content: [{ type: "text", text: output.result.text }] };
    }
  );
}

async function registerAgents(server: AcpServer) {
  const agent = await createBeeAgent();
  server.agent(
    "chat",
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
      await memory.addMany(
        messages.map(({ role, content }) => Message.of({ role, text: content }))
      );
      const agent = await createBeeAgent(memory, config?.tools);
      const output = await agent
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
      framework: "BeeAI",
      license: "Apache 2.0",
      fullDescription: `TBD`,
      avgRunTimeSeconds: 10,
      avgRunTokens: 48,
      ui: "chat",
    } as const satisfies Metadata
  );

  server.agent(
    contentJudge.name,
    contentJudge.description,
    contentJudge.inputSchema,
    contentJudge.outputSchema,
    contentJudge.run,
    contentJudge.metadata
  );

  server.agent(
    podcastCreator.name,
    podcastCreator.description,
    podcastCreator.inputSchema,
    podcastCreator.outputSchema,
    podcastCreator.run,
    podcastCreator.metadata
  );
}

// Server

export async function createServer() {
  const server = new AcpServer(
    {
      name: "beeai-framework",
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

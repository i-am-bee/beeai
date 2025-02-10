#!/usr/bin/env npx -y tsx

import express from "express";
import { McpServer } from "@agentcommunicationprotocol/sdk/server/mcp.js";

import { z } from "zod";
import { StreamlitAgent } from "bee-agent-framework/agents/experimental/streamlit/agent";
import { OllamaChatLLM } from "bee-agent-framework/adapters/ollama/chat";
import { UnconstrainedMemory } from "bee-agent-framework/memory/unconstrainedMemory";
import { Version } from "bee-agent-framework";
import { SSEServerTransport } from "@agentcommunicationprotocol/sdk/server/sse.js";

async function registerAgents(server: McpServer) {
  const streamlitMeta = new StreamlitAgent({
    llm: new OllamaChatLLM(),
    memory: new UnconstrainedMemory(),
  }).meta;
  server.agent(
    streamlitMeta.name,
    streamlitMeta.description,
    z.object({
      prompt: z.string(),
    }),
    z.object({
      code: z.string(),
    }),
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
                delta: { code: delta },
              });
            }
          });
        });
      return {
        code: output.result.raw,
      };
    }
  );
}

export async function runServer() {
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

  const app = express();
  app.get('/sse', async (req,res) => {
    const transport = new SSEServerTransport("/messages", res);
    app.post("/messages", async (req, res) => {
        await transport.handlePostMessage(req, res);
    })
    await server.connect(transport);
  })

  const port = parseInt(process.env.PORT ?? "3001")
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

await runServer();

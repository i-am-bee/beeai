#!/usr/bin/env npx -y tsx@latest

import { AcpServer } from "@i-am-bee/acp-sdk/server/acp.js";
import { runAgentProvider } from "@i-am-bee/beeai-sdk/providers/agent";
import {
  promptInputSchema,
  PromptOutput,
  promptOutputSchema,
} from "@i-am-bee/beeai-sdk/schemas/prompt";
import { Version } from "bee-agent-framework";
import { createBeeSupervisor } from "bee-supervisor";

async function registerAgents(server: AcpServer) {
  server.agent(
    "bee-supervisor",
    "Bla bla",
    promptInputSchema,
    promptOutputSchema,
    async function ({ ...input }, { signal }): Promise<PromptOutput> {
      const agent = await createBeeSupervisor();
      const output = await agent.run(
        {
          prompt: input.params.input.prompt,
        },
        {
          execution: {
            maxIterations: 100,
            maxRetriesPerStep: 2,
            totalMaxRetries: 10,
          },
          signal,
        }
      );

      return {
        text: output.result.text,
      };
    }
  );
}

// Server
export async function createServer() {
  const server = new AcpServer(
    {
      name: "bee-supervisor",
      version: Version,
    },
    {
      capabilities: {
        tools: {},
        agents: {},
      },
    }
  );
  await registerAgents(server);
  return server;
}

const server = await createServer();
await runAgentProvider(server);

#!/usr/bin/env npx -y tsx@latest

import { AcpServer } from "@i-am-bee/acp-sdk/server/acp.js";

import { Version } from "beeai-framework";
import { runAgentProvider } from "@i-am-bee/beeai-sdk/providers/agent";
import { agent as agentDocsCreator } from "./agent-docs-creator.js";

async function registerAgents(server: AcpServer) {
  server.agent(
    agentDocsCreator.name,
    agentDocsCreator.description,
    agentDocsCreator.inputSchema,
    agentDocsCreator.outputSchema,
    agentDocsCreator.run,
    agentDocsCreator.metadata
  );
}

export async function createServer() {
  const server = new AcpServer({
    name: "agent-docs-creator",
    version: Version,
  });
  await registerAgents(server);
  return server;
}

const server = await createServer();
await runAgentProvider(server);

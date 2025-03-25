#!/usr/bin/env -S npx -y tsx@latest

import "./instrumentation.js";
import { AcpServer } from "@i-am-bee/acp-sdk/server/acp";

import { Version } from "beeai-framework";
import { runAgentProvider } from "@i-am-bee/beeai-sdk/providers/agent";
import { agent as podcastCreator } from "./podcast-creator.js";

async function registerAgents(server: AcpServer) {
  server.agent(
    podcastCreator.name,
    podcastCreator.description,
    podcastCreator.inputSchema,
    podcastCreator.outputSchema,
    podcastCreator.run(server),
    podcastCreator.metadata
  );
}

export async function createServer() {
  const server = new AcpServer({
    name: "podcast-creator",
    version: Version,
  });
  await registerAgents(server);
  return server;
}

const server = await createServer();
await runAgentProvider(server);

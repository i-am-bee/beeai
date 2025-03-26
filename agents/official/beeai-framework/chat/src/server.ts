#!/usr/bin/env -S npx -y tsx@latest

import "./instrumentation.js";
import { AcpServer } from "@i-am-bee/acp-sdk/server/acp";

import { Version } from "beeai-framework";
import { runAgentProvider } from "@i-am-bee/beeai-sdk/providers/agent";
import { agent as chat } from "./chat.js";

async function registerTools(server: AcpServer) {
  await chat.registerTools(server);
}

async function registerAgent(server: AcpServer) {
  server.agent(
    chat.name,
    chat.description,
    chat.inputSchema,
    chat.outputSchema,
    chat.run(server),
    chat.metadata
  );
}

export async function createServer() {
  const server = new AcpServer({
    name: "chat",
    version: Version,
  });
  await registerTools(server);
  await registerAgent(server);
  return server;
}

const server = await createServer();
await runAgentProvider(server);

#!/usr/bin/env -S BEE_FRAMEWORK_INSTRUMENTATION_ENABLED=true npx -y tsx@latest --inspect

import "dotenv/config";

process.env.OPENAI_API_KEY ??= process.env.LLM_API_KEY;
process.env.OPENAI_MODEL_SUPERVISOR ??= process.env.LLM_MODEL ?? "gpt-4o";
process.env.OPENAI_MODEL_OPERATOR ??= process.env.LLM_MODEL ?? "gpt-4o";
process.env.OPENAI_API_ENDPOINT ??=
  process.env.LLM_API_BASE ?? "https://api.openai.com/v1";

import { AcpServer } from "@i-am-bee/acp-sdk/server/acp.js";

import { Version } from "beeai-framework";
import { runAgentProvider } from "@i-am-bee/beeai-sdk/providers/agent";
import { agent as supervisor } from "./supervisor/supervisor.js";

async function registerAgents(server: AcpServer) {
  server.agent(
    supervisor.name,
    supervisor.description,
    supervisor.inputSchema,
    supervisor.outputSchema,
    supervisor.run(server),
    supervisor.metadata
  );
}

export async function createServer() {
  const server = new AcpServer({
    name: "beeai-supervisor",
    version: Version,
  });
  await registerAgents(server);
  return server;
}

const server = await createServer();
await runAgentProvider(server);

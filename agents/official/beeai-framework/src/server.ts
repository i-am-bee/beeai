#!/usr/bin/env -S npx -y tsx@latest

import "./instrumentation.js";
import { AcpServer } from "@i-am-bee/acp-sdk/server/acp";

import { Version } from "beeai-framework";
import { runAgentProvider } from "@i-am-bee/beeai-sdk/providers/agent";
import { agent as chat } from "./chat/chat.js";
import { agent as contentJudge } from "./content-judge/content-judge.js";
import { agent as podcastCreator } from "./podcast-creator/podcast-creator.js";

async function registerTools(server: AcpServer) {
  await chat.registerTools(server);
}

async function registerAgents(server: AcpServer) {
  server.agent(
    chat.name,
    chat.description,
    chat.inputSchema,
    chat.outputSchema,
    chat.run(server),
    chat.metadata
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
    podcastCreator.run(server),
    podcastCreator.metadata
  );
}

export async function createServer() {
  const server = new AcpServer({
    name: "beeai-framework",
    version: Version,
  });
  await registerTools(server);
  await registerAgents(server);
  return server;
}

const server = await createServer();
await runAgentProvider(server);

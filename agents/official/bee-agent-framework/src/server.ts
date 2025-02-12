#!/usr/bin/env npx -y tsx

import { McpServer } from "@agentcommunicationprotocol/sdk/server/mcp.js";

import { StreamlitAgent } from "bee-agent-framework/agents/experimental/streamlit/agent";
import { OllamaChatLLM } from "bee-agent-framework/adapters/ollama/chat";
import { UnconstrainedMemory } from "bee-agent-framework/memory/unconstrainedMemory";
import { Version } from "bee-agent-framework";
import { runAgentProvider } from "beeai-sdk/src/beeai_sdk/providers/agent.js";
import {
  promptInputSchema,
  promptOutputSchema,
  PromptOutput,
} from "beeai-sdk/src/beeai_sdk/schemas/prompt.js";
import { Metadata } from "beeai-sdk/src/beeai_sdk/schemas/metadata.js";

async function registerAgents(server: McpServer) {
  const streamlitMeta = new StreamlitAgent({
    llm: new OllamaChatLLM(),
    memory: new UnconstrainedMemory(),
  }).meta;
  server.agent(
    streamlitMeta.name,
    streamlitMeta.description,
    promptInputSchema,
    promptOutputSchema,
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
                delta: { text: delta } as PromptOutput,
              });
            }
          });
        });
      return {
        text: output.result.raw,
      };
    },
    {
      title: "Streamlit Agent",
      framework: "CrewAI",
      licence: "Apache 2.0",
      fullDescription: `This is an example AI agent.
## Features
- Feature 1  
- Feature 2  
- Feature 3`,
      avgRunTimeSeconds: 10,
      avgRunTokens: 48,
    } as const satisfies Metadata
  );

  // for UI development purposes
  server.agent(
    "gpt-researcher",
    "LLM based autonomous agent that conducts deep local and web research on any topic and generates a long report with citations.",
    promptInputSchema,
    promptOutputSchema,
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
                delta: { text: delta } as PromptOutput,
              });
            }
          });
        });
      return {
        text: output.result.raw,
      };
    },
    {
      title: "GPT Researcher",
      framework: "BeeAI",
      licence: "Apache 2.0",
      fullDescription: `GPT Researcher is an autonomous agent designed for comprehensive web and local research on any given task.

The agent produces detailed, factual, and unbiased research reports with citations. GPT Researcher provides a full suite of customization options to create tailor made and domain specific research agents. Inspired by the recent Plan-and-Solve and RAG papers, GPT Researcher addresses misinformation, speed, determinism, and reliability by offering stable performance and increased speed through parallelized agent work.

Our mission is to empower individuals and organizations with accurate, unbiased, and factual information through AI.

## Why GPT Researcher?

- Objective conclusions for manual research can take weeks, requiring vast resources and time.
- LLMs trained on outdated information can hallucinate, becoming irrelevant for current research tasks.
- Current LLMs have token limitations, insufficient for generating long research reports.
- Limited web sources in existing services lead to misinformation and shallow results.
- Selective web sources can introduce bias into research tasks.

## Architecture

The core idea is to utilize 'planner' and 'execution' agents. The planner generates research questions, while the execution agents gather relevant information. The publisher then aggregates all findings into a comprehensive report.

Steps:
- Create a task-specific agent based on a research query.
- Generate questions that collectively form an objective opinion on the task.
- Use a crawler agent for gathering information for each question.
- Summarize and source-track each resource.
- Filter and aggregate summaries into a final research report.

## Disclaimer

This project, GPT Researcher, is an experimental application and is provided "as-is" without any warranty, express or implied. We are sharing codes for academic purposes under the Apache 2 license. Nothing herein is academic advice, and NOT a recommendation to use in academic or research papers.
Our view on unbiased research claims:
1. The main goal of GPT Researcher is to reduce incorrect and biased facts. How? We assume that the more sites we scrape the less chances of incorrect data. By scraping multiple sites per research, and choosing the most frequent information, the chances that they are all wrong is extremely low.
2. We do not aim to eliminate biases; we aim to reduce it as much as possible. We are here as a community to figure out the most effective human/llm interactions.
3. In research, people also tend towards biases as most have already opinions on the topics they research about. This tool scrapes many opinions and will evenly explain diverse views that a biased person would never have read.`,
      avgRunTimeSeconds: 2.1,
      avgRunTokens: 111,
    } satisfies Metadata
  );
}

export async function createServer() {
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
  return server;
}

const server = await createServer();
await runAgentProvider(server);

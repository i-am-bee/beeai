import { DynamicTool, JSONToolOutput } from "beeai-framework/tools/base";
import { BeeAgent } from "beeai-framework/agents/bee/agent";
import { TokenMemory } from "beeai-framework/memory/tokenMemory";

import {
  promptInputSchema,
  promptOutputSchema,
} from "@i-am-bee/beeai-sdk/schemas/prompt";
import { z } from "zod";
import { SSEClientTransport } from "@i-am-bee/acp-sdk/client/sse.js";
import { Client as MCPClient } from "@i-am-bee/acp-sdk/client/index.js";
import { OpenAIChatModel } from "beeai-framework/adapters/openai/backend/chat";

const platformSdk = (client: MCPClient, availableAgents: string[]) => {
  const listAgents = async () => {
    const agents = await client.listAgents();

    return agents.agents
      .filter((agent) => availableAgents.includes(agent.name))
      .map((agent) => ({
        id: agent.name,
        description: agent.description,
      }));
  };

  const runAgent = async (agent: string, prompt: string) => {
    console.log(`Called agent - ${agent} and prompting it with - ${prompt}`);

    const agents = await listAgents();
    if (!agents.map(({ id }) => id).includes(agent)) {
      throw new Error(`Agent ${agent} is not registered in the platform`);
    }

    return client.runAgent(
      { name: agent, input: { prompt } },
      { timeout: 10000000 }
    );
  };

  return { listAgents, runAgent };
};

const inputSchema = promptInputSchema.extend({
  availableAgents: z.array(z.string()),
});

export const agent = async ({
  params,
}: {
  params: { input: z.infer<typeof inputSchema> };
}) => {
  const transport = new SSEClientTransport(
    new URL("http://localhost:8333/mcp/sse")
  );
  const client = new MCPClient(
    {
      name: "supervisor-agent",
      version: "1.0.0",
    },
    {}
  );
  await client.connect(transport);

  const systemPrompt = `
    Your role is being a supervisor to orchestrate work to accomplish a task that user has provided.

    You are able to list all available agents that are described in the registryOfAvailableAgents tool.

    You should delegate all the work to other agents by using runAgent tool.

    After you've gathered enough data from individual agents you can then provide the result to the user.
  `;

  const registryTool = new DynamicTool({
    name: "registryOfAvailableAgents",
    description:
      "Provides a registry of available agents and their capabilities to perform particular tasks. It will provide a list of agents and their capabilities.",
    inputSchema: z.object({}),
    handler: async () => {
      const agents = await platformSdk(
        client,
        params.input.availableAgents
      ).listAgents();

      return new JSONToolOutput(agents);
    },
  });

  const runAgentTool = new DynamicTool({
    name: "runAgent",
    description:
      "Runs an agent to complete a task. Takes agent id that matches the agent from the registry of available agents and prompt as a parameter and provides string as output",
    inputSchema: z.object({
      agentId: z.string().describe("Agent identifier"),
      prompt: z.string().describe("Task description"),
    }),
    handler: async ({ prompt, agentId }) => {
      const result = await platformSdk(
        client,
        params.input.availableAgents
      ).runAgent(agentId, prompt);

      return new JSONToolOutput(result);
    },
  });

  const agent = new BeeAgent({
    llm: new OpenAIChatModel(
      "gpt-4o-mini",
      {},
      {
        apiKey: process.env.OPENAI_API_KEY,
      }
    ),
    memory: new TokenMemory(),
    tools: [registryTool, runAgentTool],
    templates: {
      system: (template) =>
        template.fork((config) => {
          config.defaults.instructions = systemPrompt;
        }),
    },
  });

  const response = await agent.run({ prompt: params.input.prompt });

  return { text: response.result.text };
};

export const supervisorAgent = {
  name: "supervisor",
  description:
    "Supervisor agent that can select individual agents in BeeAI platform and dynamically compose them to solve a problem prompted by the user.",
  inputSchema: inputSchema,
  outputSchema: promptOutputSchema,
  metadata: {
    title: "Supervisor",
    framework: "BeeAI",
    licence: "Apache 2.0",
    fullDescription: `An agent implementing supervisor pattern.`,
  },
  run: agent,
} as const;

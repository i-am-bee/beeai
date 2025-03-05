import { AcpServer } from "@i-am-bee/acp-sdk/server/acp.js";
import { MessageOutput } from "@i-am-bee/beeai-sdk/schemas/message";
import { Metadata } from "@i-am-bee/beeai-sdk/schemas/metadata";
import {
  textInputSchema,
  textOutputSchema,
} from "@i-am-bee/beeai-sdk/schemas/text";
import { createBeeSupervisor } from "@i-am-bee/beeai-supervisor";
import { CreateAgentConfig } from "@i-am-bee/beeai-supervisor/agents/registry/registry.js";
import { z } from "zod";
import { AgentFactory } from "./agent-factory.js";
import { PlatformSdk } from "./platform-sdk.js";

const inputSchema = textInputSchema.extend({
  availableAgents: z.array(z.string()),
});
type Input = z.infer<typeof inputSchema>;
const outputSchema = textOutputSchema;

const run =
  (server: AcpServer) =>
  async (
    {
      params: { input, _meta },
    }: {
      params: {
        input: Input;
        _meta?: { progressToken?: string | number };
      };
    },
    { signal }: { signal?: AbortSignal }
  ) => {
    // ****************************************************************************************************
    // Connect platform
    // ****************************************************************************************************
    const platformSdk = PlatformSdk.getInstance();
    await platformSdk.init(
      input.availableAgents.map((a) => a.toLocaleLowerCase())
    );
    const listedPlatformAgents = await platformSdk.listAgents();
    const agentConfigFixtures = listedPlatformAgents.map(
      ({ beeAiAgentId, description }) =>
        ({
          agentKind: "operator",
          agentConfigVersion: 1,
          agentType: beeAiAgentId,
          description: description,
          autoPopulatePool: false,
          instructions: "Not used",
          tools: [],
          maxPoolSize: 10,
        } as CreateAgentConfig)
    );

    const supervisorAgent = await createBeeSupervisor({
      agentConfigFixtures,
      agentFactory: new AgentFactory(),
      switches: {
        agentRegistry: {
          mutableAgentConfigs: false,
          restoration: false,
        },
        taskManager: {
          restoration: false,
        },
      },
      workspace: "beeai",
      outputDirPath: "./output",
    });

    const response = await supervisorAgent
      .run(
        {
          prompt: input.text,
        },
        {
          execution: {
            maxIterations: 100,
            maxRetriesPerStep: 2,
            totalMaxRetries: 10,
          },
          signal,
        }
      )
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
      text: response.result.text,
      logs: [],
    };
  };

export const agent = {
  name: "supervisor",
  description:
    "A supervisor agent that autonomously decomposes complex tasks, assigns them to the most suitable agents, and orchestrates execution within a multi-agent system. It iteratively evaluates results, determines follow-up tasks, and dynamically adapts workflows until an optimal solution is reached before responding to the user.",
  inputSchema,
  outputSchema,
  run,
  metadata: {
    fullDescription: "TBD",
    framework: "BeeAI",
    license: "Apache 2.0",
    languages: ["TypeScript"],
    githubUrl:
      "https://github.com/i-am-bee/beeai/blob/main/agents/official/beeai-framework/src/supervisor",
    avgRunTimeSeconds: 1000_000,
    avgRunTokens: 1000_000,
  } satisfies Metadata,
};

import { BeeAgent } from "beeai-framework/agents/bee/agent";
import {
  BaseAgentFactory,
  CreateAgentInput,
} from "@i-am-bee/beeai-supervisor/agents/base/agent-factory.js";
import { PlatformSdk } from "./platform-sdk.js";
import { Switches } from "@i-am-bee/beeai-supervisor";
import { supervisor } from "@i-am-bee/beeai-supervisor/agents/index.js";
import { AgentIdValue } from "@i-am-bee/beeai-supervisor/agents/registry/dto.js";
import { agentType } from "@i-am-bee/beeai-supervisor/ui/config.js";
import { TokenMemory } from "beeai-framework/memory/tokenMemory";
import { getChatLLM } from "@i-am-bee/beeai-supervisor/helpers/llm.js";
import { BaseToolsFactory } from "@i-am-bee/beeai-supervisor/base/tools-factory.js";

class BeeAiAgent {
  constructor(
    private _agentId: AgentIdValue,
    private _description: string,
    private _beeAiAgentId: string
  ) {}

  get agentId() {
    return this._agentId;
  }

  get description() {
    return this._description;
  }

  get beeAiAgentId() {
    return this._beeAiAgentId;
  }
}

export type AgentType = BeeAiAgent | BeeAgent;

export class AgentFactory extends BaseAgentFactory<AgentType> {
  createAgent(
    input: CreateAgentInput,
    toolsFactory: BaseToolsFactory,
    switches?: Switches
  ): AgentType {
    switch (input.agentKind) {
      case "supervisor": {
        const llm = getChatLLM(input.agentKind);
        const tools = toolsFactory.createTools(input.tools);

        return new BeeAgent({
          meta: {
            name: input.agentId,
            description: input.description,
          },
          llm,
          memory: new TokenMemory({ maxTokens: llm.parameters.maxTokens }),
          tools,
          templates: {
            system: (template) =>
              template.fork((config) => {
                config.defaults.instructions =
                  supervisor.SUPERVISOR_INSTRUCTIONS(input.agentId, switches);
              }),
          },
        });
      }
      case "operator":
        return new BeeAiAgent(
          input.agentId,
          input.description,
          input.agentType
        );
      default:
        throw new Error(`Undefined agent kind agentKind:${input.agentKind}`);
    }
  }
  async runAgent(
    agent: AgentType,
    prompt: string,
    onUpdate: (key: string, value: string) => void,
    signal?: AbortSignal
  ) {
    if (agent instanceof BeeAgent) {
      const resp = await agent
        .run(
          { prompt },
          {
            signal,
            execution: {
              maxIterations: 100,
              maxRetriesPerStep: 2,
              totalMaxRetries: 10,
            },
          }
        )
        .observe((emitter) => {
          emitter.on("update", async ({ update }) => {
            onUpdate(update.key, update.value);
          });
        });

      return resp.result.text;
    }

    if (agent instanceof BeeAiAgent) {
      const resp = await PlatformSdk.getInstance().runAgent(
        agent.beeAiAgentId,
        prompt,
        (notification) => {
          const logs = (
            notification.params.delta.logs as ({
              level: string;
              message: string;
            } | null)[]
          ).filter((it) => it != null);
          logs.forEach((log) => {
            onUpdate("thought", log.message);
          });
        },
        signal
      );

      return String(resp.output.text);
    }

    throw new Error(`Undefined agent ${agentType}`);
  }
}

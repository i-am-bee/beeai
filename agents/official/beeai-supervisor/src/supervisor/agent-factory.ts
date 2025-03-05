import { BeeAgent } from "beeai-framework/agents/bee/agent";
import {
  BaseAgentFactory,
  CreateAgentInput,
} from "beeai-supervisor/agents/base/agent-factory.js";
import { PlatformSdk } from "./platform-sdk.js";
import { Switches } from "beeai-supervisor";
import { supervisor } from "beeai-supervisor/agents/index.js";
import { AgentIdValue } from "beeai-supervisor/agents/registry/dto.js";
import { agentType } from "beeai-supervisor/ui/config.js";
import { TokenMemory } from "beeai-framework/memory/tokenMemory";
import { getChatLLM } from "beeai-supervisor/helpers/llm.js";
import { BaseToolsFactory } from "beeai-supervisor/base/tools-factory.js";

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
  async runAgent(agent: AgentType, prompt: string) {
    if (agent instanceof BeeAgent) {
      const resp = await agent.run(
        { prompt },
        {
          execution: {
            maxIterations: 8,
            maxRetriesPerStep: 2,
            totalMaxRetries: 10,
          },
        }
      );

      return resp.result.text;
    }

    if (agent instanceof BeeAiAgent) {
      const resp = await PlatformSdk.getInstance().runAgent(
        agent.beeAiAgentId,
        prompt
      );
      return String(resp.output.text);
    }

    throw new Error(`Undefined agent ${agentType}`);
  }
}

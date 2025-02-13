import { useMCPClient } from '@/contexts/MCPClient';
import { useMutation } from '@tanstack/react-query';
import { Agent, AgentRunProgressNotificationSchema } from '@agentcommunicationprotocol/sdk/types.js';
// import { promptOutputSchema } from 'beeai-sdk/src/beeai_sdk/schemas/prompt.js';

export function useSendMessage() {
  const client = useMCPClient();

  const query = useMutation({
    mutationFn: ({ agent, input }: SendMessageParams) => {
      const progressToken = crypto.randomUUID();

      client.setNotificationHandler(
        AgentRunProgressNotificationSchema,
        // AgentRunProgressNotificationSchema.extend({ params: { delta: promptOutputSchema } }),
        (notification) => {
          console.log(notification);
        },
      );

      return client.runAgent({
        _meta: { progressToken },
        name: agent.name,
        input: { prompt: input },
      });
    },
  });

  return query;
}

export interface SendMessageParams {
  input: string;
  agent: Agent;
}

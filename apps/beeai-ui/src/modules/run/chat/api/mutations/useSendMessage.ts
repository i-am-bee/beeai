import { useMCPClient } from '@/contexts/MCPClient';
import { useMutation } from '@tanstack/react-query';
import { Agent, AgentRunProgressNotificationSchema } from '@agentcommunicationprotocol/sdk/types.js';
// import { promptOutputSchema } from 'beeai-sdk/src/beeai_sdk/schemas/prompt.js';

interface Props {
  onMessageDelta?: (delta: string) => void;
}

export function useSendMessage({ onMessageDelta }: Props = {}) {
  const client = useMCPClient();

  const query = useMutation({
    mutationFn: ({ agent, input }: SendMessageParams) => {
      const progressToken = crypto.randomUUID();

      client.setNotificationHandler(
        AgentRunProgressNotificationSchema,
        // TODO: extend with promptOutputSchema
        // AgentRunProgressNotificationSchema.extend({ params: z.object({ delta: promptOutputSchema }) }),
        (notification) => {
          onMessageDelta?.(String(notification.params.delta.text));
        },
      );

      return client.runAgent(
        {
          _meta: { progressToken },
          name: agent.name,
          input: { prompt: input },
        },
        // TODO: abort
        // {signal},
      );
    },
  });

  return query;
}

export interface SendMessageParams {
  input: string;
  agent: Agent;
}

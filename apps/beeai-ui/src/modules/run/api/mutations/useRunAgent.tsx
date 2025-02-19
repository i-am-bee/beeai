import { useMutation } from '@tanstack/react-query';
import { Agent } from '@i-am-bee/acp-sdk/types.js';
import z, { ZodLiteral, ZodObject } from 'zod';
import { useCreateMCPClient } from '@/api/mcp-client/useCreateMCPClient';

interface Props<
  NotificationsSchema extends ZodObject<{
    method: ZodLiteral<string>;
  }>,
> {
  agent: Agent;
  notifications?: {
    schema: NotificationsSchema;
    handler: (notification: z.infer<NotificationsSchema>) => void | Promise<void>;
  };
}

export function useRunAgent<
  Input extends { [x: string]: unknown },
  NotificationsSchema extends ZodObject<{
    method: ZodLiteral<string>;
  }>,
>({ agent, notifications }: Props<NotificationsSchema>) {
  const createClient = useCreateMCPClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async ({ input, abortController }: { input: Input; abortController?: AbortController }) => {
      const client = await createClient();
      if (!client) throw new Error('Connecting to MCP server failed.');

      if (notifications) {
        client.setNotificationHandler(notifications.schema, notifications.handler);
      }

      return client.runAgent(
        {
          _meta: { progressToken: notifications ? crypto.randomUUID() : undefined },
          name: agent.name,
          input,
        },
        {
          timeout: 10 * 60 * 1000, // 10 minutes
          signal: abortController?.signal,
        },
      );
    },
  });

  return { runAgent: mutateAsync, isPending };
}

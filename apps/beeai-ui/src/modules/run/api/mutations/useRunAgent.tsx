/**
 * Copyright 2025 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useCreateMCPClient } from '#api/mcp-client/useCreateMCPClient.ts';
import { Agent } from '@i-am-bee/acp-sdk/types.js';
import { useMutation } from '@tanstack/react-query';
import z, { ZodLiteral, ZodObject } from 'zod';
import { QueryMetadata } from '#contexts/QueryProvider/types.ts';

interface Props<
  NotificationsSchema extends ZodObject<{
    method: ZodLiteral<string>;
  }>,
> {
  notifications?: {
    schema: NotificationsSchema;
    handler: (notification: z.infer<NotificationsSchema>) => void | Promise<void>;
  };
  queryMetadata?: QueryMetadata;
}

interface RunMutationProps<Input extends { [x: string]: unknown }> {
  agent: Agent;
  input: Input;
  abortController?: AbortController;
}

export function useRunAgent<
  Input extends { [x: string]: unknown },
  NotificationsSchema extends ZodObject<{
    method: ZodLiteral<string>;
  }>,
>({ notifications, queryMetadata }: Props<NotificationsSchema>) {
  const createClient = useCreateMCPClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async ({ agent, input, abortController }: RunMutationProps<Input>) => {
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
    meta: queryMetadata ?? {
      errorToast: {
        title: 'Agent run failed',
        includeErrorMessage: true,
      },
    },
  });

  return { runAgent: mutateAsync, isPending };
}

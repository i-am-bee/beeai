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

import { agentKeys } from '#modules/agents/api/keys.ts';
import { Agent } from '#modules/agents/api/types.ts';
import { providerKeys } from '#modules/providers/api/keys.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteProvider } from '..';

export function useDeleteProvider() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteProvider,
    onSuccess: (_data, variables) => {
      // The removal of the provider agents is basically done immediately, but it is an asynchronous operation, so instead of the classic invalidation that would return the old data, we set the correct data here.
      queryClient.setQueriesData<{ agents: Agent[] }>(
        {
          queryKey: agentKeys.lists(),
        },
        (data) => {
          const agents = data?.agents.filter((agent) => agent.provider !== variables.id);

          return agents
            ? {
                ...data,
                agents,
              }
            : data;
        },
      );
    },
    meta: {
      invalidates: [providerKeys.lists()],
      errorToast: {
        title: 'Failed to delete provider.',
      },
    },
  });

  return mutation;
}

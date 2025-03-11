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

import { useToast } from '#contexts/Toast/index.ts';
import { TaskType, useTasks } from '#hooks/useTasks.ts';
import { agentKeys } from '#modules/agents/api/keys.ts';
import { useListProviderAgents } from '#modules/agents/api/queries/useListProviderAgents.ts';
import { useQueryClient } from '@tanstack/react-query';
import pluralize from 'pluralize';
import { useCallback, useEffect, useState } from 'react';
import { useProvider } from '../api/queries/useProvider';

interface Props {
  id?: string;
}

export function useMonitorProvider({ id }: Props) {
  const [isDone, setIsDone] = useState(false);
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { addTask, removeTask } = useTasks();

  const { data: provider, refetch: refetchProvider } = useProvider({
    id,
    refetchInterval: (data) => (data?.status === 'ready' ? false : CHECK_PROVIDER_STATUS_INTERVAL),
  });
  const status = provider?.status;
  const { data: agents, refetch: refetchAgents } = useListProviderAgents({ provider: id, enabled: status === 'ready' });

  const checkProvider = useCallback(async () => {
    const { data: provider } = await refetchProvider();
    const status = provider?.status;

    if (status === 'ready') {
      const { data: agents } = await refetchAgents();
      const agentsCount = agents?.length ?? 0;

      queryClient.invalidateQueries({ queryKey: agentKeys.lists() });

      addToast({
        title: `${agentsCount} ${pluralize('agent', agentsCount)} imported: ${agents?.map(({ name }) => name).join(', ')}`,
        kind: 'info',
        timeout: 5_000,
      });
    } else if (status === 'error') {
      addToast({
        title: 'Error during agents import. Check the files in the URL provided.',
        timeout: 5_000,
      });
    }

    if (status === 'ready' || status === 'error') {
      if (id) {
        removeTask({ id, type: TaskType.ProviderStatusCheck });
      }

      setIsDone(true);
    }
  }, [id, queryClient, refetchProvider, refetchAgents, addToast, removeTask]);

  useEffect(() => {
    if (id && !isDone) {
      addTask({
        id,
        type: TaskType.ProviderStatusCheck,
        task: checkProvider,
        delay: CHECK_PROVIDER_STATUS_INTERVAL,
      });
    }
  }, [id, isDone, addTask, checkProvider]);

  return {
    status,
    agents,
    checkProvider,
  };
}

const CHECK_PROVIDER_STATUS_INTERVAL = 2000;

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
import { useListAgents } from '#modules/agents/api/queries/useListAgents.ts';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useProvider } from '../api/queries/useProvider';
import { ProviderStatus } from '../api/types';

interface Props {
  id?: string;
}

export function useCheckProviderStatus({ id }: Props) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ProviderStatus>();
  const { data: agents } = useListAgents({ enabled: status === 'ready' });

  const { refetch } = useProvider({ id });

  useEffect(() => {
    if (!id) {
      return;
    }

    let timeoutId: NodeJS.Timeout | undefined;

    const checkProviderStatus = async () => {
      const { data } = await refetch();

      setStatus(data?.status);

      if (data?.status === 'ready') {
        queryClient.invalidateQueries({ queryKey: agentKeys.lists() });
      } else {
        timeoutId = setTimeout(checkProviderStatus, CHECK_PROVIDER_STATUS_INTERVAL);
      }
    };

    checkProviderStatus();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [id, refetch, queryClient]);

  return {
    status,
    agents: agents?.filter((agent) => agent.provider === id) || [],
  };
}

const CHECK_PROVIDER_STATUS_INTERVAL = 5000;

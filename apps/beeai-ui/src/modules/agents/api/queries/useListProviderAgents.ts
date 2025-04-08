/**
 * Copyright 2025 © BeeAI a Series of LF Projects, LLC
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

import { useQuery } from '@tanstack/react-query';

import { useMCPClient } from '#contexts/MCPClient/index.ts';

import { agentKeys } from '../keys';
import type { ListAgentsParams } from '../types';

interface Props {
  provider?: string;
  params?: ListAgentsParams;
  enabled?: boolean;
}

export function useListProviderAgents({ provider, params, enabled = true }: Props) {
  const client = useMCPClient();

  const query = useQuery({
    queryKey: agentKeys.list({ params, provider }),
    queryFn: () => client!.listAgents(params),
    enabled: Boolean(enabled && provider && client),
    select: (data) => data.agents.filter((agent) => agent.provider === provider),
  });

  return query;
}

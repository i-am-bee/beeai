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

import { useMCPClient } from '#contexts/MCPClient/index.ts';
import { useQuery } from '@tanstack/react-query';
import { agentKeys } from '../keys';
import { Agent } from '../types';

interface Props {
  name: string;
}

export function useAgent({ name }: Props) {
  const client = useMCPClient();

  return useQuery({
    queryKey: agentKeys.list(),
    queryFn: () => client!.listAgents(),
    enabled: Boolean(client),
    select: (data) => {
      const agent = data?.agents.find((item) => name === item.name);

      return agent ? (agent as Agent) : null;
    },
  });
}

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

import { useMemo } from 'react';
import { Agent } from '../api/types';
import { AgentsFiltersParams } from '../providers/AgentsFiltersProvider';
import { getAgentTitle } from '../utils';

interface Props {
  agents: Agent[];
  filters: AgentsFiltersParams;
}

export function useFilteredAgents({ agents, filters }: Props) {
  const filteredAgents = useMemo(() => {
    const { framework, search } = filters;

    const searchQuery = search?.trim().toLowerCase();
    const searchRegex = searchQuery ? new RegExp(searchQuery, 'i') : null;

    return agents
      ?.filter((agent) => {
        if (framework && framework !== agent.framework) {
          return false;
        }

        if (searchRegex) {
          const nameMatch = searchRegex.test(getAgentTitle(agent));
          const descriptionMatch = agent.description ? searchRegex.test(agent.description) : false;
          const fullDescriptionMatch = agent.fullDescription ? searchRegex.test(agent.fullDescription) : false;

          if (!nameMatch && !descriptionMatch && !fullDescriptionMatch) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [agents, filters]);

  return { filteredAgents, filteredCount: filteredAgents.length };
}

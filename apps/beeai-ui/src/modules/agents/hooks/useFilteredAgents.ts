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

import { useMemo } from 'react';

import { compareStrings } from '#utils/helpers.ts';

import type { Agent } from '../api/types';
import type { AgentsFiltersParams } from '../providers/AgentsFiltersProvider';

interface Props {
  agents: Agent[];
  filters: AgentsFiltersParams;
}

export function useFilteredAgents({ agents, filters }: Props) {
  const filteredAgents = useMemo(() => {
    const { search, frameworks, programmingLanguages, licenses } = filters;

    const searchQuery = search.trim().toLowerCase();
    const searchRegex = searchQuery ? new RegExp(searchQuery, 'i') : null;

    return agents
      ?.filter((agent) => {
        const { name, description, metadata } = agent;
        const { framework, programming_language, license, documentation } = metadata;

        if (frameworks.length && !frameworks.includes(framework ?? '')) {
          return false;
        }

        if (programmingLanguages.length && !programmingLanguages.includes(programming_language ?? '')) {
          return false;
        }

        if (licenses.length && !licenses.includes(license ?? '')) {
          return false;
        }

        if (searchRegex) {
          const nameMatch = searchRegex.test(name);
          const descriptionMatch = description ? searchRegex.test(description) : false;
          const documentationMatch = documentation ? searchRegex.test(documentation) : false;

          if (!nameMatch && !descriptionMatch && !documentationMatch) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => compareStrings(a.name, b.name));
  }, [agents, filters]);

  return { filteredAgents, filteredCount: filteredAgents.length };
}

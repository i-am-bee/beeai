import { useMemo } from 'react';
import { Agent } from '../api/types';
import { AgentsFiltersParams } from '../contexts/agents-context';
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

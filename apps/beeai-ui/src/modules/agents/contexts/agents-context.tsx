import { createContext } from 'react';
import { useListAgents } from '../api/queries/useListAgents';

export const AgentsContext = createContext<AgentsContextValue | null>(null);

interface AgentsContextValue {
  agentsQuery: ReturnType<typeof useListAgents>;
}

export interface AgentsFiltersParams {
  search?: string;
  framework?: string | null;
}

import { useContext } from 'react';
import { AgentsContext } from './AgentsContext';

export function useAgents() {
  const context = useContext(AgentsContext);

  if (!context) {
    throw new Error('useAgents must be used within AgentsProvider');
  }

  return context;
}

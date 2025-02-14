import { Agent } from './api/types';

export function getAgentTitle(agent: Agent) {
  return agent.title ?? agent.name;
}

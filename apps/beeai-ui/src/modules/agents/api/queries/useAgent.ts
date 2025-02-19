import { useMCPClient } from '@/contexts/MCPClient';
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

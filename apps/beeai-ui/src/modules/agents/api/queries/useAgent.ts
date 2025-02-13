import { useMemo } from 'react';
import { useListAgents } from './useListAgents';

interface Props {
  name: string;
}

export function useAgent({ name }: Props) {
  const { data, isPending, error, refetch, isRefetching } = useListAgents();

  const agent = useMemo(() => data?.find((item) => name === item.name), [data, name]);

  return {
    agent,
    isPending,
    refetch,
    isRefetching,
    error: error ?? (data && !agent ? new Error('Agent not found.') : undefined),
  };
}

import { Agent } from '../types';

interface Props {
  id: string;
}

export function useAgent({ id }: Props): Agent {
  return {
    name: '...',
    description: '...',
  };
}

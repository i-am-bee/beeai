import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProvider } from '..';
import { agentKeys } from '../keys';
import { useToast } from '@/contexts/Toast';

interface Props {
  onSuccess?: () => void;
}

export function useImportProvider({ onSuccess }: Props = {}) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: createProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.lists() });
      onSuccess?.();
    },
    // TODO: handle api errors globally
    onError: (error) => {
      addToast({
        title: 'Importing agents failed',
        subtitle: error instanceof Error ? error.message : undefined,
        timeout: 10000,
      });
    },
  });
}

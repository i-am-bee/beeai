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

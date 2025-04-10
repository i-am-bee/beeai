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

import { useMutation } from '@tanstack/react-query';

import { agentKeys } from '#modules/agents/api/keys.ts';

import { registerManagedProvider } from '..';
import { providerKeys } from '../keys';
import type { RegisterManagedProviderResponse } from '../types';

interface Props {
  onSuccess?: (data: RegisterManagedProviderResponse) => void;
}

export function useRegisterManagedProvider({ onSuccess }: Props = {}) {
  const mutation = useMutation({
    mutationFn: registerManagedProvider,
    onSuccess,
    meta: {
      invalidates: [providerKeys.lists(), agentKeys.lists()],
      errorToast: {
        title: 'Error during agents import. Check the files in the URL provided.',
      },
    },
  });

  return mutation;
}

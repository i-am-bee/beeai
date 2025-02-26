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

import { providerKeys } from '#modules/providers/api/keys.ts';
import { useMutation } from '@tanstack/react-query';
import { createEnv } from '..';
import { envKeys } from '../keys';

interface Props {
  onSuccess?: () => void;
}

export function useCreateEnv({ onSuccess }: Props = {}) {
  const mutation = useMutation({
    mutationFn: createEnv,
    onSuccess,
    meta: {
      invalidates: [envKeys.lists(), providerKeys.lists()],
      errorToast: {
        title: 'Failed to create env variable.',
      },
    },
  });

  return mutation;
}

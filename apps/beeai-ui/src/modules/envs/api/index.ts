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

import { api } from '#api/index.ts';
import { CreateEnvBody } from './types';

export async function createEnv({ body }: { body: CreateEnvBody['env'] }) {
  const response = await api.PUT('/api/v1/env', {
    body: { env: body },
  });

  if (response.error) {
    throw new Error('Failed to create env variable.');
  }

  return response.data;
}

export async function deleteEnv({ name }: { name: string }) {
  const response = await api.PUT('/api/v1/env', {
    body: {
      env: { [name]: null },
    },
  });

  if (response.error) {
    throw new Error('Failed to create env variable.');
  }

  return response.data;
}

export async function getEnvs() {
  const response = await api.GET('/api/v1/env');

  if (response.error) {
    throw new Error('Failed to get envs.');
  }

  return response.data;
}

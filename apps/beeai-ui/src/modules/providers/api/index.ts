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

import { api } from '#api/index.ts';

import type { DeleteProviderBody, InstallProviderBody, RegisterManagedProviderBody } from './types';

export async function registerManagedProvider({ body }: { body: RegisterManagedProviderBody }) {
  const response = await api.POST('/api/v1/provider/register/managed', { body });

  if (response.error != null) {
    throw new Error('Failed to register managed provider.');
  }

  return response.data;
}

export async function installProvider({ body }: { body: InstallProviderBody }) {
  const response = await api.POST('/api/v1/provider/install', { body });

  if (response.error != null) {
    throw new Error('Failed to install provider.');
  }

  return response.data;
}

export async function deleteProvider({ body }: { body: DeleteProviderBody }) {
  const response = await api.POST('/api/v1/provider/delete', { body });

  if (response.error != null) {
    throw new Error('Failed to delete provider.');
  }

  return response.data;
}

export async function getProviders() {
  const response = await api.GET('/api/v1/provider');

  if (response.error != null) {
    throw new Error('Failed to get providers.');
  }

  return response.data;
}

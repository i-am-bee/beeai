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
import { ensureData } from '#api/utils.ts';

import type { DeleteProviderPath, InstallProviderPath, RegisterManagedProviderRequest } from './types';

export async function listProviders() {
  const response = await api.GET('/api/v1/providers');

  return ensureData({ response, errorMessage: 'Failed to list providers.' });
}

export async function deleteProvider({ id }: DeleteProviderPath) {
  const response = await api.DELETE('/api/v1/providers/{id}', { params: { path: { id } } });

  return ensureData({ response, errorMessage: 'Failed to delete provider.' });
}

export async function installProvider({ id }: InstallProviderPath) {
  const response = await api.PUT('/api/v1/providers/{id}/install', { params: { path: { id } } });

  // TODO
  // const response = await api.POST('/api/v1/provider/install', {
  //   body,
  //   params: { query: { stream: true } },
  //   parseAs: 'stream',
  // });

  // const reader = response.response.body?.getReader();
  // const decoder = new TextDecoder();

  // if (!reader) throw new Error('No reader found');

  // while (true) {
  //   const { done, value } = await reader.read();
  //   if (done) break;

  //   const chunk = decoder.decode(value);

  //   console.log({ chunk });
  // }

  // console.log('done');

  return ensureData({ response, errorMessage: 'Failed to install provider.' });
}

export async function registerManagedProvider({ body }: { body: RegisterManagedProviderRequest }) {
  const response = await api.POST('/api/v1/providers/register/managed', { body });

  return ensureData({ response, errorMessage: 'Failed to register managed provider.' });
}

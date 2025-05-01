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

import { events } from 'fetch-event-stream';

import { api } from '#api/index.ts';
import { ensureData, ensureResponse } from '#api/utils.ts';

import type { CancelRunPath, CreateRunStreamRequest, ReadRunPath, ResumeRunPath, ResumeRunRequest } from './types';

export async function createRunStream({ body, signal }: { body: CreateRunStreamRequest; signal?: AbortSignal | null }) {
  const response = await api.POST('/api/v1/acp/runs', { parseAs: 'stream', body, signal });
  const stream = events(ensureResponse({ response, errorMessage: 'Failed to create run.' }), signal);

  return stream;
}

export async function readRun({ run_id }: ReadRunPath) {
  const response = await api.GET('/api/v1/acp/runs/{run_id}', { params: { path: { run_id } } });

  return ensureData({ response, errorMessage: 'Failed to read run.' });
}

export async function resumeRun({ run_id, body }: ResumeRunPath & { body: ResumeRunRequest }) {
  const response = await api.POST('/api/v1/acp/runs/{run_id}', { params: { path: { run_id } }, body });

  return ensureData({ response, errorMessage: 'Failed to resume run.' });
}

export async function cancelRun({ run_id }: CancelRunPath) {
  const response = await api.POST('/api/v1/acp/runs/{run_id}/cancel', { params: { path: { run_id } } });

  return ensureData({ response, errorMessage: 'Failed to cancel run.' });
}

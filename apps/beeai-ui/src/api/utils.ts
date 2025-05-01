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

import type { ServerSentEventMessage } from 'fetch-event-stream';
import type { FetchResponse } from 'openapi-fetch';
import type { MediaType } from 'openapi-typescript-helpers';

import { isNotNull } from '#utils/helpers.ts';

export function ensureData<T extends Record<string | number, unknown>, O, M extends MediaType>({
  response,
  errorMessage = 'API request failed.',
}: {
  response: FetchResponse<T, O, M>;
  errorMessage?: string;
}) {
  if ('error' in response) {
    handleError({ response, fallbackMessage: errorMessage });
  }

  return response.data;
}

export function ensureResponse<T extends Record<string | number, unknown>, O, M extends MediaType>({
  response,
  errorMessage = 'API request failed.',
}: {
  response: FetchResponse<T, O, M>;
  errorMessage?: string;
}) {
  if ('error' in response) {
    handleError({ response, fallbackMessage: errorMessage });
  }

  return response.response;
}

function handleError<T extends Record<string | number, unknown>, O, M extends MediaType>({
  response,
  fallbackMessage,
}: {
  response: FetchResponse<T, O, M>;
  fallbackMessage: string;
}) {
  const { error } = response;

  if (typeof error === 'object' && isNotNull(error) && 'detail' in error) {
    throw new Error((error as { detail?: string }).detail ?? fallbackMessage);
  }

  throw new Error(fallbackMessage);
}

export async function handleStream<T>({
  stream,
  onEvent,
}: {
  stream: AsyncGenerator<ServerSentEventMessage>;
  onEvent?: (event: T) => void;
}): Promise<void> {
  for await (const event of stream) {
    if (event.data) {
      onEvent?.(JSON.parse(event.data));
    }
  }
}

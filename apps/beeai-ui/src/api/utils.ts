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

import type { FetchResponse } from 'openapi-fetch';
import type { MediaType } from 'openapi-typescript-helpers';

export function ensureData<T extends Record<string | number, unknown>, O, M extends MediaType>({
  response,
  errorMessage = 'API request failed.',
}: {
  response: FetchResponse<T, O, M>;
  errorMessage?: string;
}) {
  if ('error' in response) {
    throw new Error(errorMessage);
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
    throw new Error(errorMessage);
  }

  return response.response;
}

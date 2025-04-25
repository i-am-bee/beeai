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

import type { ApiPath, ApiRequest } from '#@types/utils.ts';

export type CreateRunRequest = ApiRequest<'/api/v1/acp/runs'>;

export type ReadRunPath = ApiPath<'/api/v1/acp/runs/{run_id}'>;

export type ResumeRunPath = ApiPath<'/api/v1/acp/runs/{run_id}', 'post'>;

export type ResumeRunRequest = ApiRequest<'/api/v1/acp/runs/{run_id}'>;

export type CancelRunPath = ApiPath<'/api/v1/acp/runs/{run_id}/cancel', 'post'>;

export type MessagePart = CreateRunRequest['inputs'][number]['parts'][number];

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

import { parse } from 'yaml';

import { AGENT_REGISTRY_URL } from '@/constants';

import { ensureResponse } from './ensureResponse';

type AgentRegistry = { providers: { location: string }[] };

export async function fetchAgentRegistry(): Promise<AgentRegistry> {
  const response = await fetch(AGENT_REGISTRY_URL);
  const registry = await ensureResponse<string>({
    response,
    errorContext: 'agent registry',
    resolveAs: 'text',
  });

  return parse(registry);
}

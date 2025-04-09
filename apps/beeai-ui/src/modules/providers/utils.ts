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

import groupBy from 'lodash/groupBy';

import type { Agent } from '#modules/agents/api/types.ts';

import { ProviderSourcePrefixes } from './constants';

export const getProviderSource = (id: string) => {
  const source =
    Object.entries(ProviderSourcePrefixes)
      .find(([, prefix]) => id.startsWith(prefix))
      ?.at(0) ?? 'Unknown';

  return source;
};

export function stripProviderSourcePrefix(id: string) {
  const prefixes = Object.values(ProviderSourcePrefixes);

  return prefixes.reduce((acc, prefix) => (acc.startsWith(prefix) ? acc.slice(prefix.length) : acc), id);
}

export const groupAgentsByProvider = (agents: Agent[] | undefined) => {
  return groupBy(agents, (agent) => agent.provider);
};

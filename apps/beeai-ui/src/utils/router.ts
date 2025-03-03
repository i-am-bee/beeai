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

export const routeDefinitions = {
  home: () => '/' as const,
  notFound: () => '/not-found' as const,
  agents: () => `/${sections.agents}` as const,
  agentRun: () => `/${sections.agents}/run/:agentName` as const,
  agentDetail: () => `/${sections.agents}/:agentName` as const,
  compose: () => `/${sections.compose}` as const,
  composeSequential: () => `/${sections.compose}/sequential` as const,
  settings: () => '/settings' as const,
};

export const routes = {
  ...routeDefinitions,
  agentDetail: ({ name }: { name: string }) => `/${sections.agents}/${name}`,
  agentRun: ({ name }: { name: string }) => `/${sections.agents}/run/${name}`,
};

export const sections = { agents: 'agents', compose: 'compose' } as const;
export type NavSectionName = (typeof sections)[keyof typeof sections];

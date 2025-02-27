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
  agents: () => '/agents' as const,
  agentDetail: () => '/agents/:agentName' as const,
  agentRun: () => '/run/:agentName' as const,
  settings: () => '/settings' as const,
};

export const routes = {
  ...routeDefinitions,
  agentDetail: ({ name }: { name: string }) => `/agents/${name}`,
  agentRun: ({ name }: { name: string }) => `/run/${name}`,
};

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

import { revalidatePath } from 'next/cache';

import { NEXT_PHASE_BUILD } from '@/constants';

import { routeDefinitions } from './router';

export let agentRoutesInitialized = false;

export function initializeAgentRoutes() {
  if (NEXT_PHASE_BUILD || agentRoutesInitialized) return;

  try {
    revalidatePath(routeDefinitions.agents, 'page');
    revalidatePath(routeDefinitions.agentDetail, 'page');

    agentRoutesInitialized = true;

    return true;
  } catch (error) {
    console.error(error);
  }

  return agentRoutesInitialized;
}

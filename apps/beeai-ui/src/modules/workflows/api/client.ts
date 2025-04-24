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

import type { Workflow, WorkflowCreate, WorkflowUpdate } from './types';

// TODO: This approach feels wrong - I need to see how other API's are called and follow that structure instead
// TODO: In fact, this shouldn't be that different from the compose... Maybe I should ask others for their opinions
// TODO: This entire module probably belongs inside of the compose module instead
interface PaginatedResponse<T> {
  items: T[];
  total_count: number;
}

const BASE_URL = '/api/v1/workflows';

export const workflowsApi = {
  list: async (params?: { skip?: number; limit?: number }): Promise<PaginatedResponse<Workflow>> => {
    const queryParams = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
    const response = await fetch(`${BASE_URL}${queryParams}`);
    return response.json();
  },

  getById: async (id: string): Promise<Workflow> => {
    const response = await fetch(`${BASE_URL}/${id}`);
    return response.json();
  },

  create: async (workflow: WorkflowCreate): Promise<Workflow> => {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workflow),
    });
    return response.json();
  },

  update: async (id: string, workflow: WorkflowUpdate): Promise<Workflow> => {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workflow),
    });
    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
  },
};

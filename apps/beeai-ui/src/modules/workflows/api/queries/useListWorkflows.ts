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

import { useEffect, useState } from 'react';

import { workflowsApi } from '../client';
import type { Workflow } from '../types';

export interface PaginatedResponse<T> {
  items: T[];
  total_count: number;
}

export function useListWorkflows(params?: { skip?: number; limit?: number }) {
  const [data, setData] = useState<PaginatedResponse<Workflow> | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchWorkflows() {
      setIsLoading(true);
      setError(null);

      try {
        const workflows = await workflowsApi.list(params);
        setData(workflows);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch workflows'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchWorkflows();
  }, [params?.skip, params?.limit]);

  return { data, isLoading, error };
}

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

import { useQuery } from '@tanstack/react-query';
import type { GitHubRepoParams } from '../types';
import { gitHubRepoKeys } from '../key';
import { fetchGitHubRepo } from '..';

export function useGitHubRepo(params: GitHubRepoParams) {
  const query = useQuery({
    queryKey: gitHubRepoKeys.detail(params),
    queryFn: () => fetchGitHubRepo(params),
    staleTime: 1000 * 60 * 60 * 2, // 2 hours
    retry: 1,
    meta: {
      errorToast: false,
    },
  });

  return query;
}

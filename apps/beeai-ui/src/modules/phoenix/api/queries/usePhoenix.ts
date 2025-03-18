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

import { PHOENIX_SERVER_TARGET } from '#utils/constants.ts';
import { useQuery } from '@tanstack/react-query';
import { phoenixKeys } from '../keys';

export function usePhoenix() {
  const query = useQuery({
    queryKey: phoenixKeys.all(),
    refetchInterval: 5_000,
    enabled: Boolean(PHOENIX_SERVER_TARGET),
    queryFn: () =>
      fetch(PHOENIX_SERVER_TARGET, { mode: 'no-cors' })
        .then(() => true)
        .catch(() => false),
  });

  return query;
}

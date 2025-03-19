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
import { getProviders } from '..';
import { providerKeys } from '../keys';
import type { Provider, ProvidersList } from '../types';

interface Props {
  id?: string;
  refetchInterval?: (data?: Provider) => number | false;
}

export function useProvider({ id, refetchInterval = () => false }: Props) {
  const select = (data?: ProvidersList) => data?.items.find((item) => id === item.id);

  const query = useQuery({
    queryKey: providerKeys.list(),
    queryFn: () => getProviders(),
    select,
    enabled: Boolean(id),
    refetchInterval: (query) => refetchInterval(select(query.state.data)),
  });

  return query;
}

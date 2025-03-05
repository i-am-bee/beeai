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

import type { PropsWithChildren } from 'react';
import { matchQuery, MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { type PersistQueryClientProviderProps, PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { gitHubRepoKeys } from '#modules/home/api/key.ts';
import { useHandleError } from '#hooks/useHandleError.ts';
import type { HandleError } from './types';

const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
});

const persistOptions: PersistQueryClientProviderProps['persistOptions'] = {
  persister: localStoragePersister,
  dehydrateOptions: {
    shouldDehydrateQuery(query) {
      return query.queryKey[0] === gitHubRepoKeys.all()[0];
    },
  },
};

const createQueryClient = ({ handleError }: { handleError: HandleError }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60, // 60 seconds
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
      },
    },
    queryCache: new QueryCache({
      onError: (error, query) => {
        handleError(error, {
          errorToast: query.meta?.errorToast,
        });
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        handleError(error, {
          errorToast: mutation.meta?.errorToast,
        });
      },
      onSuccess: (_data, _variables, _context, mutation) => {
        queryClient.invalidateQueries({
          predicate: (query) =>
            mutation.meta?.invalidates?.some((queryKey) => matchQuery({ queryKey }, query)) ?? false,
        });
      },
    }),
  });

  return queryClient;
};

export function QueryProvider({ children }: PropsWithChildren) {
  const handleError = useHandleError();
  const queryClient = createQueryClient({ handleError });

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      {children}
    </PersistQueryClientProvider>
  );
}

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

import { ErrorMessage } from '#components/ErrorMessage/ErrorMessage.tsx';
import { SkeletonText } from '@carbon/react';
import pluralize from 'pluralize';
import { useFormContext } from 'react-hook-form';
import { useAgents } from '../contexts';
import { AgentsFiltersParams } from '../contexts/agents-context';
import { useFilteredAgents } from '../hooks/useFilteredAgents';
import { AgentCard } from './AgentCard';
import classes from './AgentsList.module.scss';
import { ImportAgents } from './ImportAgents';

export function AgentsList() {
  const {
    agentsQuery: { data, isPending, error, refetch, isRefetching },
  } = useAgents();
  const { watch } = useFormContext<AgentsFiltersParams>();
  const filters = watch();

  const { filteredAgents, filteredCount } = useFilteredAgents({ agents: data ?? [], filters });
  const totalCount = data?.length ?? 0;

  if (error && !data)
    return (
      <ErrorMessage
        title="Failed to load agents."
        onRetry={refetch}
        isRefetching={isRefetching}
        subtitle={error.message}
      />
    );

  return (
    <div>
      <div className={classes.header}>
        {!isPending ? (
          totalCount > 0 && (
            <p className={classes.count}>
              Showing {totalCount === filteredCount ? totalCount : `${filteredCount} of ${totalCount}`}{' '}
              {pluralize('agent', totalCount)}
            </p>
          )
        ) : (
          <SkeletonText className={classes.count} width="125px" />
        )}

        <ImportAgents />
      </div>

      <ul className={classes.list}>
        {!isPending
          ? filteredAgents?.map((agent, idx) => (
              <li key={idx}>
                <AgentCard agent={agent} />
              </li>
            ))
          : Array.from({ length: 3 }, (_, idx) => (
              <li key={idx}>
                <AgentCard.Skeleton />
              </li>
            ))}
      </ul>
    </div>
  );
}

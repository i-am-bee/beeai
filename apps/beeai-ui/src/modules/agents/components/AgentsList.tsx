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

'use client';

import pluralize from 'pluralize';
import { AgentsFiltersParams } from '../types';
import { useFilteredAgents } from '../hooks/useFilteredAgents';
import classes from './AgentsList.module.scss';
import { Agent } from '../api/types';
import { ReactNode } from 'react';

interface Props {
  agents: Agent[] | undefined;
  filters: AgentsFiltersParams;
  action?: ReactNode;
  children: (filteredAgents: Agent[]) => ReactNode;
}

export function AgentsList({ agents, filters, action, children }: Props) {
  const { filteredAgents, filteredCount } = useFilteredAgents({ agents: agents ?? [], filters });
  const totalCount = agents?.length ?? 0;
  return (
    <div>
      <div className={classes.header}>
        {totalCount > 0 && (
          <p className={classes.count}>
            Showing {totalCount === filteredCount ? totalCount : `${filteredCount} of ${totalCount}`}{' '}
            {pluralize('agent', totalCount)}
          </p>
        )}
        {action}
      </div>

      <ul className={classes.list}>{children(filteredAgents)}</ul>
    </div>
  );
}

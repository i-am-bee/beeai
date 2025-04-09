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

'use client';
import { type Agent, AgentCard, AgentsFilters, type AgentsFiltersParams, AgentsList } from '@i-am-bee/beeai-ui';
import { useFormContext } from 'react-hook-form';

import { TransitionLink } from '@/components/TransitionLink/TransitionLink';

interface Props {
  agents: Agent[] | null;
}

export function AgentsView({ agents }: Props) {
  const { watch } = useFormContext<AgentsFiltersParams>();
  const filters = watch();

  return (
    <>
      {agents ? <AgentsFilters agents={agents} /> : <AgentsFilters.Skeleton />}
      <AgentsList agents={agents ?? undefined} filters={filters} isPending={agents == null}>
        {(filteredAgents) =>
          filteredAgents.map((agent, idx) => (
            <li key={idx}>
              <AgentCard key={agent.name} agent={agent} renderTitle={renderAgentTitle} />
            </li>
          ))
        }
      </AgentsList>
    </>
  );
}

interface RenderAgentTitleProps {
  className: string;
  agent: Agent;
}

const renderAgentTitle = ({ className, agent }: RenderAgentTitleProps) => (
  <TransitionLink href={`/agents/${agent.name}`} className={className}>
    {agent.name}
  </TransitionLink>
);

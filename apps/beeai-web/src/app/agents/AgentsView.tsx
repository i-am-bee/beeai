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

"use client";
import { TransitionLink } from "@/components/TransitionLink/TransitionLink";
import {
  Agent,
  AgentCard,
  AgentsFilters,
  AgentsFiltersParams,
  AgentsList,
} from "@i-am-bee/beeai-ui";
import { useForm, FormProvider } from "react-hook-form";

interface Props {
  agents: Agent[];
}

export function AgentsView({ agents }: Props) {
  const form = useForm<AgentsFiltersParams>({
    mode: "onChange",
  });

  return (
    <FormProvider {...form}>
      <AgentsFilters agents={agents} />
      <AgentsList agents={agents} filters={form.watch()}>
        {(filteredAgents) =>
          filteredAgents.map((agent) => (
            <AgentCard
              key={agent.name}
              agent={agent}
              renderTitle={renderAgentTitle}
            />
          ))
        }
      </AgentsList>
    </FormProvider>
  );
}

const renderAgentTitle = ({
  className,
  agent,
}: {
  className: string;
  agent: Agent;
}) => (
  <TransitionLink href={`/agents/${agent.name}`} className={className}>
    {agent.name}
  </TransitionLink>
);

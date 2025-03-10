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

import { Container } from '#components/layouts/Container.tsx';
import { VersionTag } from '#components/VersionTag/VersionTag.tsx';
import { Agent } from '#modules/agents/api/types.ts';
import { useCompose } from '../contexts';
import { AddAgentButton } from './AddAgentButton';
import { AgentInstanceListItem } from './AgentInstanceListItem';
import classes from './ComposeSetup.module.scss';

export function ComposeSetup() {
  const { agents, setAgents, isPending } = useCompose();

  return (
    <div className={classes.root}>
      <Container>
        <h1>
          Compose playground <VersionTag>alpha</VersionTag>
        </h1>

        <div className={classes.agents}>
          {agents.map((agent, idx) => (
            <AgentInstanceListItem agent={agent} key={`${idx}${agent.data.name}`} idx={idx} />
          ))}

          <AddAgentButton
            isDisabled={isPending}
            onSelectAgent={(agent: Agent) => {
              setAgents((agents) => [...agents, { data: agent }]);
            }}
          />
        </div>
      </Container>
    </div>
  );
}

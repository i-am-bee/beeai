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

import { MainContent } from '#components/layouts/MainContent.tsx';
import { Container } from '#components/layouts/Container.tsx';
import classes from './ComposeLanding.module.scss';
import { VersionTag } from '#components/VersionTag/VersionTag.tsx';
import { AddAgentButton } from './components/AddAgentButton';
import { useNavigate } from 'react-router';
import { Agent } from '#modules/agents/api/types.ts';
import { routes } from '#utils/router.ts';

export function ComposeLanding() {
  const navigate = useNavigate();

  return (
    <MainContent className={classes.main}>
      <Container>
        <h1>
          Compose playground <VersionTag>alpha</VersionTag>
        </h1>

        <div className={classes.agents}>
          <AddAgentButton
            onSelectAgent={(agent: Agent) => {
              const params = new URLSearchParams({ agents: agent.name });

              navigate(`${routes.composeSequential()}?${params.toString()}`);
            }}
          />
        </div>
      </Container>
    </MainContent>
  );
}

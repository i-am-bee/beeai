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

import { TransitionLink } from '#components/TransitionLink/TransitionLink.tsx';
import { useModal } from '#contexts/Modal/index.tsx';
import { AddRequiredEnvsModal } from '#modules/envs/components/AddRequiredEnvsModal.tsx';
import { routes } from '#utils/router.ts';
import { ArrowUpRight } from '@carbon/icons-react';
import { Button } from '@carbon/react';
import isEmpty from 'lodash/isEmpty';
import { Agent } from '../api/types';
import { useMissingEnvs } from '../hooks/useMissingEnvs';
import classes from './AgentTryButton.module.scss';

interface Props {
  agent: Agent;
}

export function AgentTryButton({ agent }: Props) {
  const { openModal } = useModal();
  const { missingEnvs, isPending: isMissingEnvsPending } = useMissingEnvs({ agent });

  return agent.ui === 'chat' ? (
    <Button
      kind="primary"
      renderIcon={ArrowUpRight}
      size="md"
      className={classes.root}
      disabled={isMissingEnvsPending}
      {...(isEmpty(missingEnvs)
        ? {
            as: TransitionLink,
            to: routes.agentRun({ name: agent.name }),
          }
        : {
            onClick: () => {
              openModal((props) => <AddRequiredEnvsModal {...props} missingEnvs={missingEnvs} />);
            },
          })}
    >
      Try this agent
    </Button>
  ) : null;
}

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
import { ArrowRight } from '@carbon/icons-react';
import { Button, ButtonSkeleton } from '@carbon/react';
import clsx from 'clsx';
import isEmpty from 'lodash/isEmpty';
import type { Agent } from '../api/types';
import { useMissingEnvs } from '../hooks/useMissingEnvs';
import classes from './AgentLaunchButton.module.scss';

interface Props {
  agent: Agent;
}

export function AgentLaunchButton({ agent }: Props) {
  const { openModal } = useModal();
  const { missingEnvs, isPending: isMissingEnvsPending } = useMissingEnvs({ agent });

  return agent.ui?.type === 'chat' ? (
    <Button
      kind="primary"
      renderIcon={ArrowRight}
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
      Launch this agent
    </Button>
  ) : null;
}

AgentLaunchButton.Skeleton = function AgentLaunchButtonSkeleton() {
  /* .cds--layout--size-md fixes Carbon bug where button size prop is not respected */
  return <ButtonSkeleton size="md" className={clsx('cds--layout--size-md', classes.root)} />;
};

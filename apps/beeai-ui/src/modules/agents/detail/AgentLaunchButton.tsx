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

import { ArrowRight, Download, Redo } from '@carbon/icons-react';
import type { ButtonBaseProps } from '@carbon/react';
import { Button, ButtonSkeleton, InlineLoading } from '@carbon/react';
import clsx from 'clsx';
import isEmpty from 'lodash/isEmpty';
import { useCallback } from 'react';

import { TransitionLink } from '#components/TransitionLink/TransitionLink.tsx';
import { useModal } from '#contexts/Modal/index.tsx';
import { AddRequiredEnvsModal } from '#modules/envs/components/AddRequiredEnvsModal.tsx';
import { useInstallProvider } from '#modules/providers/api/mutations/useInstallProvider.ts';
import { SupportedUis } from '#modules/run/constants.ts';
import type { UiType } from '#modules/run/types.ts';
import { routes } from '#utils/router.ts';

import type { Agent } from '../api/types';
import { useAgentStatus } from '../hooks/useAgentStatus';
import { useMissingEnvs } from '../hooks/useMissingEnvs';
import classes from './AgentLaunchButton.module.scss';
import { InternetOffline } from './InternetOffline';

interface Props {
  agent: Agent;
}

export function AgentLaunchButton({ agent }: Props) {
  const { openModal } = useModal();
  const { missingEnvs, isPending: isMissingEnvsPending } = useMissingEnvs({ agent });
  const { isNotInstalled, isInstalling, isInstallError } = useAgentStatus({ provider: agent.provider });
  const { mutate: installProvider } = useInstallProvider();

  const { provider, ui } = agent;
  const uiType = ui?.type;
  const sharedProps: ButtonBaseProps = {
    kind: 'primary',
    size: 'md',
    className: classes.button,
  };

  const handleInstall = useCallback(() => {
    if (provider) {
      installProvider({ body: { id: provider } });
    }
  }, [installProvider, provider]);

  if (isNotInstalled || isInstalling || isInstallError) {
    return (
      <div className={classes.root}>
        <Button
          {...sharedProps}
          renderIcon={isInstalling ? InlineLoading : isInstallError ? undefined : Download}
          disabled={isInstalling}
          onClick={handleInstall}
        >
          {isInstalling ? (
            <>Installing&hellip;</>
          ) : isInstallError ? (
            <>
              <Redo />
              <span>Retry install</span>
            </>
          ) : (
            'Install to launch'
          )}
        </Button>

        {isInstallError && <InternetOffline />}
      </div>
    );
  }

  if (uiType && SupportedUis.includes(uiType as UiType)) {
    return (
      <Button
        {...sharedProps}
        renderIcon={ArrowRight}
        disabled={isMissingEnvsPending}
        {...(isEmpty(missingEnvs)
          ? {
              as: TransitionLink,
              href: routes.agentRun({ name: agent.name }),
            }
          : {
              onClick: () => {
                openModal((props) => <AddRequiredEnvsModal {...props} missingEnvs={missingEnvs} />);
              },
            })}
      >
        Launch this agent
      </Button>
    );
  }

  return null;
}

AgentLaunchButton.Skeleton = function AgentLaunchButtonSkeleton() {
  /* .cds--layout--size-md fixes Carbon bug where button size prop is not respected */
  return <ButtonSkeleton size="md" className={clsx('cds--layout--size-md', classes.root)} />;
};

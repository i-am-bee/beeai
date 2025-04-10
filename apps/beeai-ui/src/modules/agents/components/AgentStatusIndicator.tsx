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

import { CloudDownload } from '@carbon/icons-react';
import { IconButton, InlineLoading } from '@carbon/react';
import clsx from 'clsx';
import { useCallback } from 'react';

import { useInstallProvider } from '#modules/providers/api/mutations/useInstallProvider.ts';

import type { Agent } from '../api/types';
import { useAgentStatus } from '../hooks/useAgentStatus';
import classes from './AgentStatusIndicator.module.scss';

interface Props {
  agent: Agent;
}

export function AgentStatusIndicator({ agent }: Props) {
  const { provider } = agent;
  const { isNotInstalled, isInstalling, isInstallError } = useAgentStatus({ provider });
  const { mutate: installProvider } = useInstallProvider();

  const handleInstall = useCallback(() => {
    if (provider) {
      installProvider({ body: { id: provider } });
    }
  }, [installProvider, provider]);

  if (isInstalling) {
    return (
      <div className={classes.root}>
        <InlineLoading />
      </div>
    );
  }

  if (isNotInstalled || isInstallError) {
    return (
      <IconButton
        kind="ghost"
        size="sm"
        wrapperClasses={clsx(classes.root, classes.button)}
        label="Install agent"
        onClick={handleInstall}
      >
        <CloudDownload />
      </IconButton>
    );
  }

  return null;
}

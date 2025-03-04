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
import { Container } from '#components/layouts/Container.tsx';
import { Loading } from '@carbon/react';
import { useAgent } from '../agents/api/queries/useAgent';
import { getAgentTitle } from '../agents/utils';
import classes from './AgentRun.module.scss';
import { Chat } from './chat/Chat';
import { ChatProvider } from './contexts/ChatProvider';

interface Props {
  name: string;
}

export function AgentRun({ name }: Props) {
  const { data: agent, isPending, refetch, isRefetching, error } = useAgent({ name });

  return !isPending ? (
    agent ? (
      agent.ui?.type === 'chat' ? (
        <ChatProvider agent={agent}>
          <Chat />
        </ChatProvider>
      ) : (
        <Container size="sm">
          <h1>{getAgentTitle(agent)}</h1>
          <div className={classes.uiNotAvailable}>
            {agent.ui?.type
              ? `The UI requested by the agent is not available: '${agent.ui.type}'`
              : `The agent doesn’t have a defined UI.`}
          </div>
        </Container>
      )
    ) : (
      <Container size="sm">
        <ErrorMessage
          title="Failed to load the agent."
          onRetry={refetch}
          isRefetching={isRefetching}
          subtitle={error?.message}
        />
      </Container>
    )
  ) : (
    <div className={classes.loading}>
      <Loading withOverlay={false} />
    </div>
  );
}

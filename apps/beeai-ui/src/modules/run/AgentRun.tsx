import { ErrorMessage } from '@/components/ErrorMessage/ErrorMessage';
import { Container } from '@/components/layouts/Container';
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
      agent.ui === 'chat' ? (
        <ChatProvider agent={agent}>
          <Chat />
        </ChatProvider>
      ) : (
        <Container size="sm">
          <h1>{getAgentTitle(agent)}</h1>
          <div className={classes.uiNotAvailable}>
            {agent.ui
              ? `The UI requested by the agent is not available: '${agent.ui}'`
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

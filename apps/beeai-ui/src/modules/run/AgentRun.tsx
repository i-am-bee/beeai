import { Container } from '@/components/layouts/Container';
import { useAgent } from '../agents/api/queries/useAgent';
import classes from './AgentRun.module.scss';
import { Loading } from '@carbon/react';
import { ErrorMessage } from '@/components/ErrorMessage/ErrorMessage';
import { Chat } from './chat/Chat';
import { ChatProvider } from './contexts/ChatProvider';
import { getAgentTitle } from '../agents/utils';

interface Props {
  name: string;
}

export function AgentRun({ name }: Props) {
  const { agent, isPending, refetch, isRefetching, error } = useAgent({ name });

  return !isPending ? (
    agent ? (
      agent.ui === 'chat' ? (
        <ChatProvider agent={agent}>
          <Chat />
        </ChatProvider>
      ) : (
        <Container>
          <h1>{getAgentTitle(agent)}</h1>
          <div className={classes.uiNotAvailable}>
            {agent.ui
              ? `The UI requested by the agent is not available: '${agent.ui}'`
              : `The agent doesn’t have a defined UI.`}
          </div>
        </Container>
      )
    ) : (
      <Container>
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

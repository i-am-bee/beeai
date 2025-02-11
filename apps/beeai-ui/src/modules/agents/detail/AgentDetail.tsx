import { Container } from '@/components/layouts/Container';
import { ViewHeader } from '@/components/ViewHeader';
import { ViewStack } from '@/components/ViewStack';
import classes from './AgentDetail.module.scss';
import { useListAgents } from '../api/queries/useListAgents';
import { AgentStats } from '../components/AgentStats';
import { useMemo } from 'react';
import { AgentTags } from '../components/AgentTags';
import { Button, Layer } from '@carbon/react';
import { TextWithCopyButton } from '@/components/TextWithCopyButton/TextWithCopyButton';
import { ArrowUpRight } from '@carbon/icons-react';
import Markdown from 'react-markdown';

interface Props {
  id: string;
}

export function AgentDetail({ id }: Props) {
  const { data, isPending } = useListAgents();

  const agent = useMemo(() => data?.find((item) => id === item.id), [data, id]);

  const runCommand = `beeai run ${id}`;

  return (
    <Container>
      <ViewStack>
        {agent ? (
          <>
            <header className={classes.header}>
              <div className={classes.metadata}>
                <AgentStats agent={agent} />
              </div>
              <h1>{agent.name}</h1>
            </header>

            <div className={classes.body}>
              <Markdown className={classes.description}>{agent.description}</Markdown>
              <AgentTags agent={agent} />
            </div>
            <div className={classes.runAgent}>
              <Layer level={1}>
                <TextWithCopyButton text={runCommand} isCode>
                  {runCommand}
                </TextWithCopyButton>
              </Layer>
              <Button kind="primary" renderIcon={ArrowUpRight} size="md">
                Try this agent
              </Button>
            </div>
          </>
        ) : null}
      </ViewStack>
    </Container>
  );
}

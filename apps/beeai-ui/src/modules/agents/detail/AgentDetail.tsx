import { CopySnippet } from '@/components/CopySnippet/CopySnippet';
import { ErrorMessage } from '@/components/ErrorMessage/ErrorMessage';
import { Container } from '@/components/layouts/Container';
import { MarkdownContent } from '@/components/MarkdownContent/MarkdownContent';
import { TagsList } from '@/components/TagsList/TagsList';
import { ViewStack } from '@/components/ViewStack/ViewStack';
import { routes } from '@/utils/router';
import { isStringTerminalParameterSafe } from '@/utils/strings';
import { ArrowUpRight } from '@carbon/icons-react';
import { Button, ButtonSkeleton, SkeletonPlaceholder, SkeletonText } from '@carbon/react';
import { useAgent } from '../api/queries/useAgent';
import { AgentMetadata } from '../components/AgentMetadata';
import { AgentTags } from '../components/AgentTags';
import classes from './AgentDetail.module.scss';

interface Props {
  name: string;
}

export function AgentDetail({ name }: Props) {
  const { agent, isPending, error, refetch, isRefetching } = useAgent({ name });

  const runCommand = `beeai run ${isStringTerminalParameterSafe(name) ? name : `'${name}'`}`;

  return (
    <Container>
      <ViewStack>
        {!isPending ? (
          agent ? (
            <div className={classes.root}>
              <header className={classes.header}>
                <div className={classes.metadata}>
                  <AgentMetadata agent={agent} />
                  <AgentTags agent={agent} />
                </div>
                <h1>{agent?.title ?? agent.name}</h1>
              </header>

              <MarkdownContent className={classes.description}>{agent.description}</MarkdownContent>

              <div className={classes.runAgent}>
                <CopySnippet snippet={runCommand} className={classes.runCommandInput} />

                <Button kind="primary" renderIcon={ArrowUpRight} size="md" href={routes.agentRun(name)}>
                  Try this agent
                </Button>
              </div>

              {agent.fullDescription && (
                <>
                  <hr />
                  <div className={classes.body}>
                    <MarkdownContent>{agent.fullDescription}</MarkdownContent>
                  </div>
                </>
              )}
            </div>
          ) : (
            <ErrorMessage
              title="Failed to load the agent."
              onRetry={refetch}
              isRefetching={isRefetching}
              subtitle={error?.message}
            />
          )
        ) : (
          <AgentCardSkeleton />
        )}
      </ViewStack>
    </Container>
  );
}

function AgentCardSkeleton() {
  return (
    <div className={classes.skeleton}>
      <header className={classes.header}>
        <div className={classes.metadata}>
          <SkeletonText width="20%" />
          <TagsList.Skeleton length={2} />
        </div>
        <h1>
          <SkeletonPlaceholder className={classes.name} />
        </h1>
      </header>

      <div className={classes.body}>
        <SkeletonText className={classes.description} paragraph lineCount={6} />
      </div>

      <div className={classes.runAgent}>
        <ButtonSkeleton />
        <ButtonSkeleton />
      </div>
    </div>
  );
}

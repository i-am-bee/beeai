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

import { CopySnippet } from '@/components/CopySnippet/CopySnippet';
import { ErrorMessage } from '@/components/ErrorMessage/ErrorMessage';
import { Container } from '@/components/layouts/Container';
import { MarkdownContent } from '@/components/MarkdownContent/MarkdownContent';
import { TagsList } from '@/components/TagsList/TagsList';
import { routes } from '@/utils/router';
import { isStringTerminalParameterSafe } from '@/utils/strings';
import { ArrowUpRight } from '@carbon/icons-react';
import { Button, ButtonSkeleton, SkeletonText } from '@carbon/react';
import clsx from 'clsx';
import { useAgent } from '../api/queries/useAgent';
import { AgentMetadata } from '../components/AgentMetadata';
import { AgentTags } from '../components/AgentTags';
import { getAgentTitle } from '../utils';
import classes from './AgentDetail.module.scss';

interface Props {
  name: string;
}

export function AgentDetail({ name }: Props) {
  const { data: agent, isPending, error, refetch, isRefetching } = useAgent({ name });

  const runCommand = `beeai agent run ${isStringTerminalParameterSafe(name) ? name : `'${name}'`}`;

  return (
    <Container>
      {!isPending ? (
        agent ? (
          <div className={classes.root}>
            <h1 className={classes.name}>{getAgentTitle(agent)}</h1>

            <AgentMetadata agent={agent} className={classes.metadata} />

            {agent.description && (
              <MarkdownContent className={classes.description}>{agent.description}</MarkdownContent>
            )}

            <AgentTags agent={agent} className={classes.tags} />

            <div className={classes.buttons}>
              {agent.ui === 'chat' && (
                <Button
                  kind="primary"
                  renderIcon={ArrowUpRight}
                  size="md"
                  href={routes.agentRun({ name })}
                  className={classes.tryButton}
                >
                  Try this agent
                </Button>
              )}

              <CopySnippet snippet={runCommand} className={classes.copySnippet} />
            </div>

            {agent.fullDescription && (
              <>
                <hr className={classes.divider} />

                <MarkdownContent>{agent.fullDescription}</MarkdownContent>
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
        <AgentDetailSkeleton />
      )}
    </Container>
  );
}

function AgentDetailSkeleton() {
  return (
    <div className={classes.root}>
      <SkeletonText className={classes.name} width="50%" />

      <AgentMetadata.Skeleton className={classes.metadata} />

      <SkeletonText className={classes.description} paragraph lineCount={3} />

      <TagsList.Skeleton length={2} className={classes.tags} />

      <div className={classes.buttons}>
        {/* .cds--layout--size-md fixes Carbon bug where button size prop is not respected */}
        <ButtonSkeleton size="md" className={clsx('cds--layout--size-md', classes.tryButton)} />

        <ButtonSkeleton size="md" className={clsx('cds--layout--size-md', classes.copySnippet)} />
      </div>

      <hr className={classes.divider} />

      <SkeletonText paragraph lineCount={6} />
    </div>
  );
}

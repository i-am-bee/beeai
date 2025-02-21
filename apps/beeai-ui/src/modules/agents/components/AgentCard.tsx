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

import { MarkdownContent } from '@/components/MarkdownContent/MarkdownContent';
import { TagsList } from '@/components/TagsList/TagsList';
import { routes } from '@/utils/router';
import { SkeletonText } from '@carbon/react';
import { Agent } from '../api/types';
import { getAgentTitle } from '../utils';
import classes from './AgentCard.module.scss';
import { AgentMetadata } from './AgentMetadata';
import { AgentTags } from './AgentTags';
import { TransitionLink } from '@/components/TransitionLink/TransitionLink';

interface Props {
  agent: Agent;
}

export function AgentCard({ agent }: Props) {
  const { name, description } = agent;
  const route = routes.agentDetail({ name });

  return (
    <article className={classes.root}>
      <h2 className={classes.name}>
        <TransitionLink className={classes.link} to={route}>
          {getAgentTitle(agent)}
        </TransitionLink>
      </h2>

      <div className={classes.body}>
        <AgentMetadata agent={agent} />

        {description && <MarkdownContent className={classes.description}>{description}</MarkdownContent>}

        <AgentTags agent={agent} />
      </div>
    </article>
  );
}

AgentCard.Skeleton = function AgentCardSkeleton() {
  return (
    <div className={classes.root}>
      <SkeletonText className={classes.name} width="50%" />

      <div className={classes.body}>
        <AgentMetadata.Skeleton />

        <SkeletonText className={classes.description} paragraph lineCount={2} />

        <TagsList.Skeleton length={2} />
      </div>
    </div>
  );
};

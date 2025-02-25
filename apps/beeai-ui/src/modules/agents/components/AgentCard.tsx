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

'use client';

import { MarkdownContent } from '#components/MarkdownContent/MarkdownContent.tsx';
import { TagsList } from '#components/TagsList/TagsList.tsx';
import { SkeletonText } from '@carbon/react';
import { Agent } from '../api/types';
import classes from './AgentCard.module.scss';
import { AgentMetadata } from './AgentMetadata';
import { AgentTags } from './AgentTags';
import { ReactNode } from 'react';

interface Props {
  agent: Agent;
  renderTitle: (props: { className: string; agent: Agent }) => ReactNode;
}

export function AgentCard({ agent, renderTitle }: Props) {
  const { description } = agent;
  return (
    <article className={classes.root}>
      <h2 className={classes.name}>{renderTitle({ className: classes.link, agent })}</h2>

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

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

import { TagsList } from '#components/TagsList/TagsList.tsx';
import type { Agent } from '#modules/agents/api/types.ts';
import { AgentTags } from '#modules/agents/components/AgentTags.tsx';
import { SkeletonText } from '@carbon/react';
import clsx from 'clsx';
import type { MouseEvent } from 'react';
import classes from './AgentListOption.module.scss';
import { BeeBadge } from '#modules/agents/components/BeeBadge.tsx';

interface Props {
  agent: Agent;
  onClick: (event: MouseEvent) => void;
}
export function AgentListOption({ agent, onClick }: Props) {
  return (
    <li className={classes.root} role="option" onClick={onClick}>
      <div className={classes.content}>
        <span className={classes.name}>
          {agent.name}
          <BeeBadge agent={agent} />
        </span>

        <AgentTags agent={agent} size="sm" />
      </div>
    </li>
  );
}

AgentListOption.Skeleton = function AgentListOptionSkeleton() {
  return (
    <li className={clsx(classes.root, classes.skeleton)}>
      <SkeletonText className={classes.name} width="50%" />
      <TagsList.Skeleton length={2} />
    </li>
  );
};

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

import { Time } from '@carbon/icons-react';
import { SkeletonText } from '@carbon/react';
import clsx from 'clsx';
import { Agent } from '../api/types';
import classes from './AgentMetadata.module.scss';

interface Props {
  agent: Agent;
  className?: string;
}

export function AgentMetadata({ agent, className }: Props) {
  const { avgRunTimeSeconds, avgRunTokens, license } = agent;

  return (
    <ul className={clsx(classes.root, className)}>
      {avgRunTimeSeconds && (
        <li className={classes.item}>
          <Time />
          {avgRunTimeSeconds}s/run (avg)
        </li>
      )}
      {avgRunTokens && <li className={classes.item}>{avgRunTokens} tokens/run (avg)</li>}
      {license && <li className={classes.item}>{license}</li>}
    </ul>
  );
}

interface SkeletonProps {
  className?: string;
}

AgentMetadata.Skeleton = function AgentMetadataSkeleton({ className }: SkeletonProps) {
  return <SkeletonText className={clsx(classes.root, className)} width="33%" />;
};

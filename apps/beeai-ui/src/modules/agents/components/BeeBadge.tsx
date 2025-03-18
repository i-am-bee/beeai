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

import type { ComponentProps } from 'react';
import { Tag } from '@carbon/react';
import { BEE_AI_FRAMEWORK_TAG } from '#utils/constants.ts';
import { Tooltip } from '#components/Tooltip/Tooltip.tsx';
import Bee from '#svgs/bee.svg';
import type { Agent } from '../api/types';
import classes from './BeeBadge.module.scss';

interface Props {
  agent: Agent;
  size?: ComponentProps<typeof Tag>['size'];
}

export function BeeBadge({ agent, size }: Props) {
  const { framework } = agent;
  return (
    <>
      {framework === BEE_AI_FRAMEWORK_TAG && (
        <Tooltip content="Built by the BeeAI team" placement="top" asChild>
          <div className={classes.container}>
            <Tag type="green" renderIcon={Bee} size={size} className={classes.tag} />
          </div>
        </Tooltip>
      )}
    </>
  );
}

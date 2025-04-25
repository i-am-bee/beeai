/**
 * Copyright 2025 © BeeAI a Series of LF Projects, LLC
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

import type { ToggleProps } from '@carbon/react';
import { SkeletonIcon, SkeletonText, Toggle, ToggleSkeleton } from '@carbon/react';

import type { Tool } from '#modules/tools/api/types.ts';
import { ToolIcon } from '#modules/tools/components/ToolIcon.tsx';
import { ToolName } from '#modules/tools/components/ToolName.tsx';

import classes from './ToolToggle.module.scss';

interface Props extends Pick<ToggleProps, 'toggled' | 'onToggle'> {
  tool: Tool;
}
export function ToolToggle({ tool, ...props }: Props) {
  const { name } = tool;

  return (
    <div className={classes.root}>
      <ToolIcon name={name} />

      <h3 className={classes.heading}>
        <ToolName name={name} />
      </h3>

      <Toggle {...props} id={name} className={classes.toggle} size="sm" />
    </div>
  );
}

ToolToggle.Skeleton = function ToolToggleSkeleton() {
  return (
    <div className={classes.root}>
      <span className={classes.icon}>
        <SkeletonIcon />
      </span>

      <SkeletonText className={classes.heading} />

      <ToggleSkeleton className={classes.toggle} />
    </div>
  );
};

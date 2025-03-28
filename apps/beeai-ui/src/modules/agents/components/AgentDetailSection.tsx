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

import { SkeletonText, type SkeletonTextProps } from '@carbon/react';
import clsx from 'clsx';
import type { ReactNode } from 'react';

import classes from './AgentDetailSection.module.scss';

interface Props {
  title: string;
  titleSpacing?: 'default' | 'large';
  children: ReactNode;
}

export function AgentDetailSection({ title, titleSpacing = 'default', children }: Props) {
  return (
    <section className={classes.section}>
      <h2 className={clsx(classes.title, classes[`${titleSpacing}Spacing`])}>{title}</h2>
      {children}
    </section>
  );
}

interface SkeletonProps {
  titleWidth: Required<SkeletonTextProps['width']>;
  lineCount: Required<SkeletonTextProps['lineCount']>;
}

AgentDetailSection.Skeleton = function AgentDetailSectionSkeleton({ titleWidth, lineCount }: SkeletonProps) {
  return (
    <>
      <SkeletonText className={clsx(classes.title, classes.defaultSpacing)} width={titleWidth} />
      <SkeletonText paragraph lineCount={lineCount} />
    </>
  );
};

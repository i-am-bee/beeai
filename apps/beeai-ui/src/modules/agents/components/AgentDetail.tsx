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

import { spacing } from '@carbon/layout';
import { moderate01 } from '@carbon/motion';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Agent } from '../api/types';
import classes from './AgentDetail.module.scss';
import { ReactNode } from 'react';
import { getAgentTitle } from '../utils';
import { AgentMetadata } from './AgentMetadata';
import { MarkdownContent } from '#components/MarkdownContent/MarkdownContent.tsx';
import { AgentTags } from './AgentTags';
import { CopySnippet } from '#components/CopySnippet/CopySnippet.tsx';
import { isStringTerminalParameterSafe } from '#utils/strings.ts';
import { fadeProps } from '#utils/fadeProps.ts';
import { ButtonSkeleton, SkeletonText } from '@carbon/react';
import { TagsList } from '#components/TagsList/TagsList.tsx';

interface Props {
  agent: Agent;
  buttons?: ReactNode;
}

export function AgentDetail({ agent, buttons }: Props) {
  const { name } = agent;
  const runCommand = `beeai run ${isStringTerminalParameterSafe(name) ? name : `'${name}'`}`;
  return (
    <div className={classes.root}>
      <motion.h1 {...fadeInPropsWithMarginShift({ start: { from: spacing[4] } })} className={classes.name}>
        {getAgentTitle(agent)}
      </motion.h1>

      <motion.div {...fadeInPropsWithMarginShift({ start: { from: spacing[3] } })}>
        <AgentMetadata agent={agent} className={classes.metadata} />
        {agent.description && <MarkdownContent className={classes.description}>{agent.description}</MarkdownContent>}
        <AgentTags agent={agent} className={classes.tags} />
      </motion.div>

      <motion.div
        {...fadeInPropsWithMarginShift({ start: { from: spacing[6], to: spacing[5] } })}
        className={classes.buttons}
      >
        {buttons}
        <CopySnippet snippet={runCommand} className={classes.copySnippet} />
      </motion.div>

      {agent.fullDescription && (
        <>
          <motion.hr
            {...fadeInPropsWithMarginShift({
              start: { from: spacing[9], to: spacing[8] },
              end: { from: spacing[9], to: spacing[8] },
            })}
            className={classes.divider}
          />

          <MarkdownContent>{agent.fullDescription}</MarkdownContent>
        </>
      )}
    </div>
  );
}

AgentDetail.Skeleton = function AgentDetailSkeleton() {
  return (
    <div className={classes.root}>
      <SkeletonText className={classes.name} width="50%" />

      <AgentMetadata.Skeleton className={classes.metadata} />

      <div className={classes.description}>
        <SkeletonText paragraph lineCount={3} />
      </div>

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
};

function fadeInPropsWithMarginShift({
  start,
  end,
}: {
  start?: { from: string; to?: string };
  end?: { from: string; to?: string };
}) {
  return fadeProps({
    hidden: {
      marginBlockStart: start ? start.from : undefined,
      marginBlockEnd: end ? end.from : undefined,
    },
    visible: {
      marginBlockStart: start ? start.to || 0 : undefined,
      marginBlockEnd: end ? end.to || 0 : undefined,
      transition: { delay: parseFloat(moderate01) / 1000 },
    },
  });
}

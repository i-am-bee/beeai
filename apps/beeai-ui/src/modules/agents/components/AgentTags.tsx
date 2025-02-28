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

import type { ReactElement } from 'react';
import { Tag } from '@carbon/react';
import { LogoGithub } from '@carbon/icons-react';
import { TagsList } from '#components/TagsList/TagsList.tsx';
import { Tooltip } from '#components/Tooltip/Tooltip.tsx';
import Bee from '#svgs/Bee.svg';
import { BEE_AI_FRAMEWORK_TAG } from '#utils/constants.ts';
import { isNotNull } from '#utils/helpers.ts';
import type { Agent } from '../api/types';
import classes from './AgentTags.module.scss';

interface Props {
  agent: Agent;
  showGitHub?: boolean;
  className?: string;
}

export function AgentTags({ agent, showGitHub, className }: Props) {
  const { framework, githubUrl } = agent;

  const tags: ReactElement[] = [
    framework ? <AgentTag key={framework} name={framework} /> : null,
    showGitHub && githubUrl ? <AgentGitHubTag key={githubUrl} href={githubUrl} /> : null,
  ].filter(isNotNull);

  return <TagsList tags={tags} className={className} />;
}

function AgentTag({ name }: { name: string }) {
  return name === BEE_AI_FRAMEWORK_TAG ? (
    <Tooltip content="Built by the BeeAI team" placement="top" asChild>
      <Tag type="green" renderIcon={Bee}>
        {name}
      </Tag>
    </Tooltip>
  ) : (
    <Tag type="cool-gray">{name}</Tag>
  );
}

function AgentGitHubTag({ href }: { href: string }) {
  return <Tag type="cool-gray" as="a" href={href} target="_blank" renderIcon={LogoGithub} className={classes.link} />;
}

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

import { IbmWatsonDiscovery, PartlyCloudy, Tools } from '@carbon/icons-react';

import Wikipedia from '#svgs/Wikipedia.svg';

import type { Tool } from '../api/types';
import classes from './ToolIcon.module.scss';

interface Props {
  name: Tool['name'];
}

export function ToolIcon({ name }: Props) {
  const Icon = ICONS_MAP[name as keyof typeof ICONS_MAP] ?? Tools;

  return (
    <span className={classes.root}>
      <Icon />
    </span>
  );
}

const ICONS_MAP = {
  search: IbmWatsonDiscovery,
  wikipedia: Wikipedia,
  weather: PartlyCloudy,
};

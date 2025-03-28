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

import clsx from 'clsx';
import { useEffect, useState } from 'react';

import type { RunStats } from '../types';
import { runDuration } from '../utils';
import classes from './ElapsedTime.module.scss';

interface Props {
  stats?: RunStats;
  className?: string;
}

export function ElapsedTime({ stats, className }: Props) {
  const [, forceRerender] = useState(0);

  useEffect(() => {
    if (!stats?.startTime || stats.endTime) return;

    const interval = setInterval(() => {
      forceRerender((prev) => prev + 1);
    }, 1000 / 24); // refresh at standard frame rate for smooth increments

    return () => clearInterval(interval);
  }, [stats]);

  if (!stats?.startTime) return null;

  const { startTime, endTime } = stats;
  const duration = runDuration((endTime || Date.now()) - startTime);

  return <span className={clsx(classes.root, className)}>{duration}</span>;
}

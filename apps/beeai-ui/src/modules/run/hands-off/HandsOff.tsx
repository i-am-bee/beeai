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

import { Container } from '#components/layouts/Container.tsx';
import clsx from 'clsx';
import { AgentHeader } from '../components/AgentHeader';
import { AgentRunLogs } from '../components/AgentRunLogs';
import { useHandsOff } from '../contexts/hands-off';
import classes from './HandsOff.module.scss';
import { HandsOffInput } from './HandsOffInput';
import { HandsOffText } from './HandsOffText';
import { TaskCompleted } from './TaskCompleted';
import { TaskRunningBar } from './TaskRunningBar';

export function HandsOff() {
  const { agent, logs, text, isPending, onClear } = useHandsOff();

  const isPendingOrText = Boolean(isPending || text);
  const isFinal = Boolean(text && !isPending);

  return (
    <div className={clsx(classes.root, { [classes.isPendingOrText]: isPendingOrText })}>
      <Container size="sm">
        <div className={classes.holder}>
          <AgentHeader agent={agent} onNewSessionClick={isPendingOrText ? onClear : undefined} />

          <HandsOffInput />

          <TaskCompleted />

          <HandsOffText />

          {logs && <AgentRunLogs logs={logs} toggleable={isFinal} />}

          <TaskRunningBar />
        </div>
      </Container>
    </div>
  );
}

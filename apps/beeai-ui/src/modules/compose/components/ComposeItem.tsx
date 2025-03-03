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

import { getAgentTitle } from '#modules/agents/utils.ts';
import { MarkdownContent } from '#components/MarkdownContent/MarkdownContent.tsx';
import classes from './ComposeItem.module.scss';
import { AgentInstance } from '../contexts/compose-context';
import { InlineLoading, OverflowMenu, OverflowMenuItem } from '@carbon/react';
import { useEffect, useState } from 'react';
import { useCompose } from '../contexts';
import clsx from 'clsx';

interface Props {
  agent: AgentInstance;
  idx: number;
}
export function ComposeItem({ agent: agentInstance, idx }: Props) {
  const { setAgents, isPending: isRunPending } = useCompose();
  const { data, isPending, logs, stats, result } = agentInstance;
  const { description } = data;

  const isFinished = !isPending && result;

  return (
    <div className={classes.root}>
      <div className={classes.name}>{getAgentTitle(data)}</div>

      <div className={classes.actions}>
        <OverflowMenu aria-label="Options" size="md">
          <OverflowMenuItem
            itemText="Remove"
            disabled={isRunPending}
            onClick={() => setAgents((agents) => agents.filter((_, index) => index !== idx))}
          />
        </OverflowMenu>
      </div>

      {description && <MarkdownContent className={classes.description}>{description}</MarkdownContent>}
      {(isPending || stats || result) && (
        <div className={clsx(classes.run, { [classes.finished]: isFinished })}>
          {logs?.length ? (
            <div className={classes.logs}>
              {logs.map((log, order) => (
                <div key={order}>{log}</div>
              ))}
            </div>
          ) : null}

          <div className={classes.status}>
            <div className={classes.loading}>
              <ElapsedTime stats={stats} />
              <InlineLoading status={isPending ? 'active' : 'finished'} />
            </div>
          </div>

          {isFinished && (
            <div className={classes.result}>
              <MarkdownContent>{result}</MarkdownContent>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ElapsedTime({ stats }: { stats: AgentInstance['stats'] }) {
  const [, forceRerender] = useState(0);

  useEffect(() => {
    if (!stats?.startTime || stats.endTime) return;

    const interval = setInterval(() => {
      forceRerender((prev) => prev + 1);
    }, 1000 / 24); // refresh at standard frame rate for smooth increments

    return () => clearInterval(interval);
  }, [stats]);

  if (!stats) return null;

  const { startTime, endTime } = stats;

  return <div className={classes.elapsed}>{Math.round(((endTime || Date.now()) - startTime) / 1000)}s</div>;
}

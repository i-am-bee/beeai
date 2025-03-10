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

import { MarkdownContent } from '#components/MarkdownContent/MarkdownContent.tsx';
import { ElapsedTime } from '#modules/run/components/ElapsedTime.tsx';
import { Accordion, AccordionItem, InlineLoading, OverflowMenu, OverflowMenuItem } from '@carbon/react';
import clsx from 'clsx';
import ScrollToBottom from 'react-scroll-to-bottom';
import { useCompose } from '../contexts';
import { AgentInstance } from '../contexts/compose-context';
import classes from './AgentInstanceListItem.module.scss';

interface Props {
  agent: AgentInstance;
  idx: number;
}
export function AgentInstanceListItem({ agent: agentInstance, idx }: Props) {
  const { setAgents, isPending: isRunPending } = useCompose();
  const { data, isPending, logs, stats, result } = agentInstance;
  const { name, description } = data;

  const isFinished = !isPending && result;

  return (
    <div className={classes.root}>
      <div className={classes.name}>{name}</div>

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
        <div className={clsx(classes.run, { [classes.finished]: isFinished, [classes.pending]: isPending })}>
          <Accordion>
            {logs?.length ? (
              <div className={classes.logsGroup}>
                <AccordionItem title="Logs" open={!isFinished ? isPending : undefined}>
                  <ScrollToBottom
                    className={classes.logs}
                    scrollViewClassName={classes.logsScroll}
                    mode={isPending ? 'bottom' : 'top'}
                  >
                    {logs?.map((log, order) => <div key={order}>{log}</div>)}
                  </ScrollToBottom>
                </AccordionItem>
              </div>
            ) : null}

            <div className={clsx(classes.resultGroup, { [classes.empty]: !result })}>
              <AccordionItem
                title={
                  <div className={classes.result}>
                    <div>{isFinished ? 'Output' : null}</div>
                    <div className={classes.loading}>
                      <ElapsedTime stats={stats} className={classes.elapsed} />
                      <InlineLoading status={isPending ? 'active' : 'finished'} />
                    </div>
                  </div>
                }
              >
                <MarkdownContent>{result}</MarkdownContent>
              </AccordionItem>
            </div>
          </Accordion>
        </div>
      )}
    </div>
  );
}

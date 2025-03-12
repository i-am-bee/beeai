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
import { Accordion, AccordionItem, OverflowMenu, OverflowMenuItem } from '@carbon/react';
import clsx from 'clsx';
import { SequentialFormValues } from '../contexts/compose-context';
import classes from './ComposeStepListItem.module.scss';
import { useFormContext } from 'react-hook-form';
import { TextAreaAutoHeight } from '#components/TextAreaAutoHeight/TextAreaAutoHeight.tsx';
import { useCompose } from '../contexts';
import { KeyboardEvent } from 'react';
import { AgentRunLogItem } from '#modules/run/components/AgentRunLogItem.tsx';
import { Spinner } from '#components/Spinner/Spinner.tsx';
import { useAutoScroll } from '#hooks/useAutoScroll.ts';

interface Props {
  idx: number;
}
export function ComposeStepListItem({ idx }: Props) {
  const { register, watch } = useFormContext<SequentialFormValues>();
  const {
    status,
    onSubmit,
    stepsFields: { remove },
  } = useCompose();

  const handleKeyDown = (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      onSubmit();
    }
  };

  const step = watch(`steps.${idx}`);
  const { data, isPending, logs, stats, result, instruction } = step;
  const { name } = data;

  const isViewMode = status !== 'ready';
  const isFinished = Boolean(!isPending && result);

  return (
    <div className={clsx(classes.root, classes[`status-${isPending ? 'pending' : isFinished ? 'finished' : 'ready'}`])}>
      <div className={classes.left}>
        <div className={classes.bullet}>{isPending ? <Spinner /> : <span>{idx + 1}</span>}</div>
      </div>
      <div className={classes.content}>
        <div className={classes.name}>{name}</div>

        <div className={classes.actions}>
          {!isViewMode && (
            <OverflowMenu aria-label="Options" size="md">
              <OverflowMenuItem itemText="Remove" onClick={() => remove(idx)} />
            </OverflowMenu>
          )}
        </div>

        <div className={classes.input}>
          {isViewMode ? (
            <p>{instruction}</p>
          ) : (
            <TextAreaAutoHeight
              className={classes.textarea}
              rows={3}
              placeholder="Write your entry here…"
              disabled={isViewMode}
              {...register(`steps.${idx}.instruction`, {
                required: true,
              })}
              onKeyDown={handleKeyDown}
            />
          )}
        </div>

        {(isPending || stats || result) && (
          <div className={clsx(classes.run, { [classes.finished]: isFinished, [classes.pending]: isPending })}>
            <Accordion>
              {logs?.length ? (
                <AccordionItem title="Logs" open={!isFinished ? isPending : undefined} className={classes.logsGroup}>
                  <Logs logs={logs} />
                </AccordionItem>
              ) : null}

              {isFinished && (
                <AccordionItem
                  className={clsx(classes.resultGroup, { [classes.empty]: !result })}
                  title={
                    <div className={classes.result}>
                      <div>{isFinished ? 'Output' : null}</div>
                      {/* TODO: hiding temporarily
                    <div className={classes.loading}>
                      <ElapsedTime stats={stats} className={classes.elapsed} />
                    </div> */}
                    </div>
                  }
                >
                  <MarkdownContent>{result}</MarkdownContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
        )}
      </div>
    </div>
  );
}

function Logs({ logs }: { logs: string[] }) {
  const { ref: autoScrollRef } = useAutoScroll([logs.length]);

  return (
    <div className={classes.logs}>
      {logs?.map((message, order) => <AgentRunLogItem key={order}>{message}</AgentRunLogItem>)}
      <div ref={autoScrollRef} />
    </div>
  );
}

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

import { useEffect, useRef } from 'react';
import { useCompose } from '../contexts';
import classes from './ComposeResult.module.scss';
import clsx from 'clsx';
import { AgentOutputBox } from '#modules/run/components/AgentOutputBox.tsx';
import ScrollToBottom, { useScrollToTop } from 'react-scroll-to-bottom';

export function ComposeResult() {
  const { result, status } = useCompose();

  return (
    <ScrollToBottom
      className={clsx(classes.root, { [classes.expanded]: Boolean(result) })}
      scrollViewClassName={classes.logsScroll}
      mode={status === 'pending' ? 'bottom' : 'top'}
    >
      <ResultContent />
    </ScrollToBottom>
  );
}

function ResultContent() {
  const { result, status } = useCompose();
  const scrollToTop = useScrollToTop();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = contentRef.current?.parentElement;
    if (status === 'finished' && scrollContainer) {
      scrollToTop();

      console.log({ status, scrollContainer });

      scrollContainer.scrollTop = 0;
    }
  }, [scrollToTop, status]);

  return (
    <div className={classes.content} ref={contentRef}>
      <AgentOutputBox text={result} isPending={status === 'pending'} />
    </div>
  );
}

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

import { useCompose } from '../contexts';
import classes from './ComposeResult.module.scss';
import clsx from 'clsx';
import { AgentOutputBox } from '#modules/run/components/AgentOutputBox.tsx';
import { useAutoScroll } from '#hooks/useAutoScroll.ts';

export function ComposeResult() {
  const { result, status } = useCompose();
  const { ref: autoScrollRef } = useAutoScroll([result]);

  return (
    <div className={clsx(classes.root, { [classes.expanded]: Boolean(result) })}>
      <div className={classes.content}>
        <AgentOutputBox text={result} isPending={status === 'pending'} />
      </div>
      <div ref={autoScrollRef} />
    </div>
  );
}

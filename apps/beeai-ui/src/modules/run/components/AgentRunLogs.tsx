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

import { ChevronDown } from '@carbon/icons-react';
import clsx from 'clsx';
import { useState } from 'react';
import { TextNotificationLogs } from '../api/types';
import { AgentRunLogItem } from './AgentRunLogItem';
import classes from './AgentRunLogs.module.scss';

interface Props {
  logs: TextNotificationLogs;
  toggleable?: boolean;
}

export function AgentRunLogs({ logs, toggleable }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  return logs.length > 0 ? (
    <div className={classes.root}>
      {toggleable && (
        <button
          type="button"
          className={clsx(classes.toggle, { [classes.isExpanded]: isExpanded })}
          onClick={() => setIsExpanded((expanded) => !expanded)}
        >
          <span>How did I get this result?</span>

          <ChevronDown />
        </button>
      )}

      {(!toggleable || (toggleable && isExpanded)) && (
        <ul>
          {logs.map(({ message }, idx) => (
            <li key={idx}>
              <AgentRunLogItem>{message}</AgentRunLogItem>
            </li>
          ))}
        </ul>
      )}
    </div>
  ) : null;
}

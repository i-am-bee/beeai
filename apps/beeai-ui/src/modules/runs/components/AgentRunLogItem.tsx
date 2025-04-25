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

import { ChevronDown } from '@carbon/icons-react';
import { IconButton } from '@carbon/react';
import clsx from 'clsx';
import type { PropsWithChildren } from 'react';
import { useEffect, useRef, useState } from 'react';

import { AnimateHeightChange } from '#components/AnimateHeightChange/AnimateHeightChange.tsx';

import classes from './AgentRunLogItem.module.scss';

export function AgentRunLogItem({ children }: PropsWithChildren) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const content = contentRef.current;

    if (!content) return;

    const checkContent = () => {
      if (content) {
        setIsClamped(content.scrollWidth > content.clientWidth);
      }
    };

    const observer = new ResizeObserver(checkContent);

    observer.observe(content);

    checkContent();

    return () => observer.disconnect();
  }, [children]);

  return (
    <div className={clsx(classes.root, { [classes.isExpanded]: isExpanded })}>
      <AnimateHeightChange className={classes.holder}>
        <p ref={contentRef} className={clsx(classes.content, { [classes.clamped]: !isExpanded })}>
          {children}
        </p>
      </AnimateHeightChange>

      {(isClamped || isExpanded) && (
        <div className={clsx(classes.toggle, { [classes.toggled]: isExpanded })}>
          <IconButton
            label={isExpanded ? 'Collapse' : 'Expand'}
            kind="ghost"
            size="sm"
            onClick={() => setIsExpanded((expanded) => !expanded)}
          >
            <ChevronDown />
          </IconButton>
        </div>
      )}
    </div>
  );
}

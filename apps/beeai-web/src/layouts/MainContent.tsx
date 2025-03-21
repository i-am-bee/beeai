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

'use client';

import { AppFooter, ToTopButton } from '@i-am-bee/beeai-ui';
import clsx from 'clsx';
import { usePathname } from 'next/navigation';
import { type PropsWithChildren, type UIEventHandler, useCallback, useRef, useState } from 'react';
import classes from './MainContent.module.scss';

interface Props {
  className?: string;
}

export function MainContent({ className, children }: PropsWithChildren<Props>) {
  const mainRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const isAgentsRoute = pathname === '/agents';

  const handleScroll: UIEventHandler = useCallback((event) => {
    const { scrollTop } = event.currentTarget;

    setIsScrolled(scrollTop > SCROLLED_OFFSET);
  }, []);

  const handleToTopClick = useCallback(() => {
    const mainElement = mainRef.current;

    if (mainElement) {
      mainElement.scrollTo({ top: 0 });
    }
  }, []);

  const toTopButtonVisible = isAgentsRoute && isScrolled;

  return (
    <div
      ref={mainRef}
      className={clsx(classes.root, className, {
        [classes.toTopButtonVisible]: toTopButtonVisible,
      })}
      onScroll={handleScroll}
    >
      {children}
      {toTopButtonVisible && <ToTopButton onClick={handleToTopClick} />}
      <AppFooter className={classes.footer} showThemeToggle={false} />
    </div>
  );
}

const SCROLLED_OFFSET = 48;

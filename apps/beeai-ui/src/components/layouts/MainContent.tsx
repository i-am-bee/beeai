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

import { routes } from '#utils/router.js';
import clsx from 'clsx';
import type { PropsWithChildren, UIEventHandler } from 'react';
import { useCallback, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { ToTopButton } from '../ToTopButton/ToTopButton';
import classes from './MainContent.module.scss';

interface Props {
  spacing?: 'md' | 'lg' | false;
  className?: string;
}

export function MainContent({ spacing = 'lg', className, children }: PropsWithChildren<Props>) {
  const mainRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const { pathname } = useLocation();
  const isAgentsRoute = pathname === routes.agents();

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

  return (
    <div ref={mainRef} className={clsx(classes.root, spacing && classes[spacing], className)} onScroll={handleScroll}>
      {children}

      {isAgentsRoute && isScrolled && <ToTopButton onClick={handleToTopClick} />}
    </div>
  );
}

const SCROLLED_OFFSET = 48;

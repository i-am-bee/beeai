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
import { UIEventHandler, useCallback, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { ToTopButton } from '../ToTopButton/ToTopButton';
import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';
import classes from './AppLayout.module.scss';
import { MainNav } from '../MainNav/MainNav';
import { CommunityNav } from '../CommunityNav/CommunityNav';

const SCROLLED_OFFSET = 48;

export function AppLayout() {
  const mainRef = useRef<HTMLElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const { pathname } = useLocation();
  const isHomeRoute = pathname === routes.home();
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
    <div className={classes.root}>
      <AppHeader className={classes.header}>
        <MainNav />
        {!isHomeRoute && <CommunityNav />}
      </AppHeader>

      <main ref={mainRef} className={classes.main} onScroll={handleScroll}>
        <Outlet />

        {isAgentsRoute && isScrolled && <ToTopButton onClick={handleToTopClick} />}
      </main>

      {isHomeRoute && <AppFooter className={classes.footer} />}
    </div>
  );
}

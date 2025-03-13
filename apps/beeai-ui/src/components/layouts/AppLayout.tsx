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

import { MainNav } from '#components/MainNav/MainNav.tsx';
import { UserNav } from '#components/UserNav/UserNav.tsx';
import { routes } from '#utils/router.js';
import { Outlet, useLocation } from 'react-router';
import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';
import classes from './AppLayout.module.scss';

export function AppLayout() {
  const { pathname } = useLocation();
  const isHomeRoute = pathname === routes.home();
  return (
    <div className={classes.root}>
      <AppHeader className={classes.header}>
        <MainNav />

        <UserNav />
      </AppHeader>

      <main className={classes.main} data-transition>
        <Outlet />
      </main>

      {isHomeRoute && <AppFooter className={classes.footer} />}
    </div>
  );
}

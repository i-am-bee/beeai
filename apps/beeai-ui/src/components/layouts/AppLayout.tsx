import { routes } from '@/utils/router';
import { Outlet, useLocation } from 'react-router';
import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';
import classes from './AppLayout.module.scss';

export function AppLayout() {
  const { pathname } = useLocation();
  const isHome = pathname === routes.home();

  return (
    <div className={classes.root}>
      <AppHeader className={classes.header} showCommunityNav={!isHome} />

      <main className={classes.main}>
        <Outlet />
      </main>

      {isHome && <AppFooter className={classes.footer} />}
    </div>
  );
}

import { Outlet } from 'react-router';
import { AppHeader } from './AppHeader';
import classes from './AppLayout.module.scss';

export function AppLayout() {
  return (
    <div className={classes.root}>
      <AppHeader />

      <main className={classes.main}>
        <Outlet />
      </main>
    </div>
  );
}

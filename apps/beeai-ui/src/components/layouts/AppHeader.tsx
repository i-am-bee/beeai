import { routes } from '@/utils/router';
import { NavLink } from 'react-router';
import { MainNav } from '../MainNav';
import classes from './AppHeader.module.scss';
import { Container } from './Container';

export function AppHeader() {
  return (
    <header className={classes.root}>
      <Container size="xlg">
        <div className={classes.holder}>
          <NavLink to={routes.home()} className={classes.link}>
            {__APP_NAME__}
          </NavLink>

          <MainNav />
        </div>
      </Container>
    </header>
  );
}

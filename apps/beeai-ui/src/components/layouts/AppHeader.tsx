import { routes } from '@/utils/router';
import { Link } from 'react-router';
import { MainNav } from '../MainNav';
import classes from './AppHeader.module.scss';
import { Container } from './Container';

export function AppHeader() {
  return (
    <header className={classes.root}>
      <Container size="xlg">
        <div className={classes.holder}>
          <Link to={routes.home()} className={classes.link}>
            {__APP_NAME__}
          </Link>

          <MainNav />
        </div>
      </Container>
    </header>
  );
}

import clsx from 'clsx';
import { CommunityNav } from '../CommunityNav/CommunityNav';
import { MainNav } from '../MainNav/MainNav';
import classes from './AppHeader.module.scss';
import { Container } from './Container';

interface Props {
  showCommunityNav?: boolean;
  className?: string;
}

export function AppHeader({ showCommunityNav, className }: Props) {
  return (
    <header className={clsx(classes.root, className)}>
      <Container size="xlg">
        <div className={classes.holder}>
          <MainNav />

          {showCommunityNav && <CommunityNav />}
        </div>
      </Container>
    </header>
  );
}

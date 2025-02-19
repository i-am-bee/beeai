import clsx from 'clsx';
import { CommunityNav } from '../CommunityNav/CommunityNav';
import { SideNav } from '../SideNav/SideNav';
import classes from './AppFooter.module.scss';
import { Container } from './Container';

interface Props {
  className?: string;
}

export function AppFooter({ className }: Props) {
  return (
    <footer className={clsx(classes.root, className)}>
      <Container size="xlg">
        <div className={classes.holder}>
          <SideNav />

          <CommunityNav />
        </div>
      </Container>
    </footer>
  );
}

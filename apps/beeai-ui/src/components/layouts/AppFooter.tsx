import { CommunityNav } from '../CommunityNav/CommunityNav';
import classes from './AppFooter.module.scss';
import { Container } from './Container';

interface Props {
  className?: string;
}

export function AppFooter({ className }: Props) {
  return (
    <footer className={className}>
      <Container size="lg">
        <div className={classes.holder}>
          <CommunityNav />
        </div>
      </Container>
    </footer>
  );
}

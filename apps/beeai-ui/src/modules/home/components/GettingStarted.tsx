import { Container } from '@/components/layouts/Container';
import { InstallInstructions } from '@/modules/home/components/InstallInstructions';
import LogoBeeAI from '@/svgs/LogoBeeAI.svg';
import classes from './GettingStarted.module.scss';
import { GitHubStarsButton } from './GitHubStarsButton';

export function GettingStarted() {
  return (
    <div className={classes.root}>
      <Container size="sm">
        <div className={classes.holder}>
          <LogoBeeAI />

          <p className={classes.description}>The open-source framework for building production-ready agents.</p>

          <div className={classes.cta}>
            <InstallInstructions />

            <GitHubStarsButton />
          </div>
        </div>
      </Container>
    </div>
  );
}

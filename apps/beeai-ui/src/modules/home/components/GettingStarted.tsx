import { Container } from '@/components/layouts/Container';
import LogoBeeAI from '@/svgs/LogoBeeAI.svg';
import { GET_STARTED_PYTHON_LINK, GET_STARTED_TYPESCRIPT_LINK } from '@/utils/constants';
import { ArrowUpRight } from '@carbon/icons-react';
import { Button } from '@carbon/react';
import classes from './GettingStarted.module.scss';
import { GitHubStarsButton } from './GitHubStarsButton';

export function GettingStarted() {
  return (
    <div className={classes.root}>
      <Container size="xs">
        <div className={classes.holder}>
          <LogoBeeAI />

          <p className={classes.description}>The open-source framework for building production-ready agents.</p>

          <div className={classes.bottom}>
            <div className={classes.buttons}>
              <Button
                as="a"
                href={GET_STARTED_PYTHON_LINK}
                target="_blank"
                size="md"
                kind="tertiary"
                className={classes.button}
                renderIcon={ArrowUpRight}
              >
                <span>Get started with Python</span>
              </Button>

              <a href={GET_STARTED_TYPESCRIPT_LINK} target="_blank" className={classes.link}>
                Or get started with Typescript
              </a>
            </div>

            <GitHubStarsButton />
          </div>
        </div>
      </Container>
    </div>
  );
}

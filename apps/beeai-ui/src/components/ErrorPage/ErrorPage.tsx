import NotFound from '@/svgs/NotFound.svg';
import { routes } from '@/utils/router';
import { ArrowRight } from '@carbon/icons-react';
import { Button } from '@carbon/react';
import { Link } from 'react-router';
import { Container } from '../layouts/Container';
import classes from './ErrorPage.module.scss';

export function ErrorPage() {
  return (
    <div className={classes.root}>
      <Container size="xs">
        <NotFound className={classes.image} />

        <h1 className={classes.heading}>Oooh, buzzkill.</h1>

        <p className={classes.description}>We couldn’t find the page you are looking for.</p>

        <Button as={Link} to={routes.home()} renderIcon={ArrowRight} className={classes.button}>
          Buzz back to safety!
        </Button>
      </Container>
    </div>
  );
}

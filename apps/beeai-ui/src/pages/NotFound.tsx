import { Container } from '@/components/layouts/Container';
import { ViewStack } from '@/components/ViewStack/ViewStack';
import { routes } from '@/utils/router';
import { Button } from '@carbon/react';
import { Link } from 'react-router';

export function NotFound() {
  return (
    <Container>
      <ViewStack>
        <h1>Oh no! You've wandered out of the hive!</h1>

        <p>This page is un-BEE-lievable&hellip; because it doesn’t exist!</p>

        <Button as={Link} to={routes.home()}>
          Buzz back to safety!
        </Button>
      </ViewStack>
    </Container>
  );
}

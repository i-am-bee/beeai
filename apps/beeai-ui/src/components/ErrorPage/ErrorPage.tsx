/**
 * Copyright 2025 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import NotFound from '@/svgs/NotFound.svg';
import { routes } from '@/utils/router';
import { ArrowRight } from '@carbon/icons-react';
import { Button } from '@carbon/react';
import { Container } from '../layouts/Container';
import classes from './ErrorPage.module.scss';
import { TransitionLink } from '../TransitionLink/TransitionLink';

export function ErrorPage() {
  return (
    <div className={classes.root}>
      <Container size="xs">
        <NotFound className={classes.image} />

        <h1 className={classes.heading}>Oooh, buzzkill.</h1>

        <p className={classes.description}>We couldn’t find the page you are looking for.</p>

        <Button as={TransitionLink} to={routes.home()} renderIcon={ArrowRight} className={classes.button}>
          Buzz back to safety!
        </Button>
      </Container>
    </div>
  );
}

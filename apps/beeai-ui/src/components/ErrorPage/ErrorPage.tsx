/**
 * Copyright 2025 © BeeAI a Series of LF Projects, LLC
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

import type { ReactNode } from 'react';

import NotFound from '#svgs/NotFound.svg';

import { Container } from '../layouts/Container';
import classes from './ErrorPage.module.scss';

interface Props {
  renderButton: (props: { className: string }) => ReactNode;
}

export function ErrorPage({ renderButton }: Props) {
  return (
    <div className={classes.root}>
      <Container size="xs">
        <NotFound className={classes.image} />

        <h1 className={classes.heading}>Oooh, buzzkill.</h1>

        <p className={classes.description}>We couldn’t find the page you are looking for.</p>

        {renderButton({ className: classes.button })}
      </Container>
    </div>
  );
}

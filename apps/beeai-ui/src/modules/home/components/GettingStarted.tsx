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

'use client';

import { Container } from '#components/layouts/Container.tsx';
import LogoBeeAI from '#svgs/LogoBeeAI.svg';
import { GET_STARTED_PYTHON_LINK, GET_STARTED_TYPESCRIPT_LINK } from '#utils/constants.ts';
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

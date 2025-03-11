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

import { Container } from '#components/layouts/Container.tsx';
import { MainContent } from '#components/layouts/MainContent.tsx';
import clsx from 'clsx';
import { PropsWithChildren } from 'react';
import { useHandsOff } from '../contexts/hands-off';
import { HandsOffText } from './HandsOffText';
import classes from './HandsOffView.module.scss';

export function HandsOffView({ children }: PropsWithChildren) {
  const { text } = useHandsOff();

  return text ? (
    <Container size="max">
      <div className={clsx(classes.root, classes.split)}>
        <div className={classes.leftPane}>
          <div className={clsx(classes.content, classes.scrollable)}>{children}</div>
        </div>

        <div className={classes.rightPane}>
          <div className={classes.content}>
            <HandsOffText />
          </div>
        </div>
      </div>
    </Container>
  ) : (
    <MainContent spacing="md">
      <div className={classes.root}>
        <Container size="sm">{children}</Container>
      </div>
    </MainContent>
  );
}

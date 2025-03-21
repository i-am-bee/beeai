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

import { CommunityNav } from '../CommunityNav/CommunityNav';
import classes from './AppFooter.module.scss';
import { Container } from './Container';

interface Props {
  className?: string;
}

export function AppFooter({ className }: Props) {
  return (
    <footer className={className}>
      <Container size="max">
        <div className={classes.holder}>
          <p className={classes.copyright}>
            Copyright © BeeAI a Series of LF Projects, LLC
            <br />
            For web site terms of use, trademark policy and other project policies please see{' '}
            <a href="https://lfprojects.org/" target="_blank" rel="noreferrer">
              https://lfprojects.org/
            </a>
            .
          </p>

          <CommunityNav className={classes.communityNav} />
        </div>
      </Container>
    </footer>
  );
}

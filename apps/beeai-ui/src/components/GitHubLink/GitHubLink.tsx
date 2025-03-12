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

import { GITHUB_REPO_LINK } from '#utils/constants.ts';
import { LogoGithub } from '@carbon/icons-react';
import classes from './GitHubLink.module.scss';

export function GitHubLink() {
  return (
    <a href={GITHUB_REPO_LINK} target="_blank" rel="noreferrer" className={classes.root}>
      <span>GitHub</span>
      <LogoGithub />
    </a>
  );
}

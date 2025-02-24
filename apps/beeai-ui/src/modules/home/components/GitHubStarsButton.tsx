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

import { Spinner } from '#components/Spinner/Spinner.tsx';
import { GITHUB_REPO } from '#utils/constants.ts';
import { LogoGithub } from '@carbon/icons-react';
import { Button } from '@carbon/react';
import { millify } from 'millify';
import { useGitHubRepo } from '../api/queries/useGitHubRepo';
import classes from './GitHubStarsButton.module.scss';

export function GitHubStarsButton() {
  const { data, isLoading } = useGitHubRepo(GITHUB_REPO);
  const count = data?.stargazers_count && millify(data.stargazers_count);

  return (
    <Button
      as="a"
      href={`https://github.com/${GITHUB_REPO.owner}/${GITHUB_REPO.repo}`}
      target="_blank"
      size="md"
      className={classes.root}
    >
      <LogoGithub />

      {isLoading ? <Spinner size="sm" /> : <span>{count || 'Star'}</span>}
    </Button>
  );
}

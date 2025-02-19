import { Spinner } from '@/components/Spinner/Spinner';
import { GITHUB_REPO } from '@/utils/constants';
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

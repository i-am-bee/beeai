import { GitHubRepoParams, GitHubRepoSchema } from './types';

export async function fetchGitHubRepo({ owner, repo }: GitHubRepoParams) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);

  if (!response.ok) {
    throw new Error('Failed to fetch repository data.');
  }

  const data = await response.json();

  return GitHubRepoSchema.parse(data);
}

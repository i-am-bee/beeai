import { useQuery } from '@tanstack/react-query';
import { fetchGitHubRepo } from '..';
import { gitHubRepoKeys } from '../key';
import { GitHubRepoParams } from '../types';

export function useGitHubRepo(params: GitHubRepoParams) {
  const query = useQuery({
    queryKey: gitHubRepoKeys.detail(params),
    queryFn: () => fetchGitHubRepo(params),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  return query;
}

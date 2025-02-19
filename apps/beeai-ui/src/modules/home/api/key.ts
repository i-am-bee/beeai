import { GitHubRepoParams } from './types';

export const gitHubRepoKeys = {
  all: () => ['github-repo'] as const,
  details: () => [...gitHubRepoKeys.all(), 'detail'] as const,
  detail: (params?: GitHubRepoParams) => [...gitHubRepoKeys.details(), params] as const,
};

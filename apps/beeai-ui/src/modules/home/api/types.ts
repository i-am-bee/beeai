import { z } from 'zod';
export interface GitHubRepoParams {
  owner: string;
  repo: string;
}

export const GitHubRepoSchema = z.object({
  stargazers_count: z.number(),
});

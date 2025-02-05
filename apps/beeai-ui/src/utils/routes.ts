export const routes = {
  home: () => '/' as const,
  agentDetail: () => '/agents/:agentId' as const,
  notFound: () => '/not-found' as const,
};

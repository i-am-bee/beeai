export const routeDefinitions = {
  home: () => '/' as const,
  notFound: () => '/not-found' as const,
  agents: () => '/agents' as const,
  agentDetail: () => '/agents/:agentName' as const,
  agentRun: () => '/run/:agentName' as const,
};

export const routes = {
  ...routeDefinitions,
  agentDetail: (agentName: string) => `/agents/${agentName}`,
  agentRun: (agentName: string) => `/run/${agentName}`,
};

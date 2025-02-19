export const routeDefinitions = {
  home: () => '/' as const,
  notFound: () => '/not-found' as const,
  agents: () => '/agents' as const,
  agentDetail: () => '/agents/:agentName' as const,
  agentRun: () => '/run/:agentName' as const,
};

export const routes = {
  ...routeDefinitions,
  agentDetail: ({ name }: { name: string }) => `/agents/${name}`,
  agentRun: ({ name }: { name: string }) => `/run/${name}`,
};

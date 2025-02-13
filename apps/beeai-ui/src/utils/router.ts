export const routesDefinition = {
  home: () => '/' as const,
  notFound: () => '/not-found' as const,
  agentDetail: () => '/agents/:agentName' as const,
  agentRun: () => '/run/:agentName' as const,
};

export const routes = {
  ...routesDefinition,
  agentDetail: (agentName: string) => `/agents/${agentName}`,
  agentRun: (agentName: string) => `/run/${agentName}`,
};

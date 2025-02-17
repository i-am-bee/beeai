export const routesDefinitions = {
  home: () => '/' as const,
  notFound: () => '/not-found' as const,
  agentDetail: () => '/agents/:agentName' as const,
  agentRun: () => '/run/:agentName' as const,
};

export const routes = {
  ...routesDefinitions,
  agentDetail: ({ name }: { name: string }) => `/agents/${name}`,
  agentRun: ({ name }: { name: string }) => `/run/${name}`,
};

export const routesDefinition = {
  home: () => '/' as const,
  notFound: () => '/not-found' as const,
  agentDetail: () => '/agents/:agentName' as const,
};

export const routes = {
  ...routesDefinition,
  agentDetail: (agentName: string) => `/agents/${agentName}`,
};

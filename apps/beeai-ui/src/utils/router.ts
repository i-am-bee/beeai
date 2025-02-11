export const routesDefinition = {
  home: () => '/' as const,
  notFound: () => '/not-found' as const,
  agentDetail: () => '/agents/:agentId' as const,
};

export const routes = {
  ...routesDefinition,
  agentDetail: (agentId: string) => `/agents/${agentId}`,
};

import { PropsWithChildren } from 'react';
import { MCPClientContext } from './mcp-client-context';
import { useMCPClient } from '@/api/mcp-client/useMCPClient';

export function MCPClientProvider({ children }: PropsWithChildren) {
  const client = useMCPClient();

  return <MCPClientContext.Provider value={client}>{children}</MCPClientContext.Provider>;
}

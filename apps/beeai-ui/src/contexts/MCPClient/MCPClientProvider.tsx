import { PropsWithChildren, useEffect, useState } from 'react';
import { MCPClientContext } from './mcp-client-context';
import { useCreateMCPClient } from '@/api/mcp-client/useCreateMCPClient';
import { Client as MCPClient } from '@i-am-bee/acp-sdk/client/index.js';

export function MCPClientProvider({ children }: PropsWithChildren) {
  const [client, setClient] = useState<MCPClient | null>(null);

  const createClient = useCreateMCPClient();

  useEffect(() => {
    createClient().then((client) => setClient(client));
  }, [createClient]);

  return <MCPClientContext.Provider value={client}>{children}</MCPClientContext.Provider>;
}

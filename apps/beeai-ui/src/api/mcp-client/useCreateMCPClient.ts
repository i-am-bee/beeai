import { Client as MCPClient } from '@i-am-bee/acp-sdk/client/index.js';
import { SSEClientTransport } from '@i-am-bee/acp-sdk/client/sse.js';
import { useCallback, useEffect, useState } from 'react';
import { MCP_EXAMPLE_AGENT_CONFIG, MCP_EXAMPLE_AGENT_PARAMS, MCP_SERVER_URL } from '.';

/**
 * Provides a function to create MCP client on demand
 * and it manages closing previous connections
 */
export function useCreateMCPClient() {
  const [client, setClient] = useState<MCPClient | null>(null);

  useEffect(() => {
    return () => {
      // close on hook unmount
      client?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createClient = useCallback(async () => {
    const transport = new SSEClientTransport(MCP_SERVER_URL);
    const client = new MCPClient(MCP_EXAMPLE_AGENT_CONFIG, MCP_EXAMPLE_AGENT_PARAMS);

    try {
      await client.connect(transport);

      setClient((current) => {
        if (current) {
          // close previous connection
          current.close();
        }

        return client;
      });
    } catch (error) {
      console.error('Error connecting client:', error);
      return null;
    }

    return client;
  }, []);

  return createClient;
}

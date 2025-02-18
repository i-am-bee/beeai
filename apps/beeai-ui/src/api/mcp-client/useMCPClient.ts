import { Client as MCPClient } from '@agentcommunicationprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@agentcommunicationprotocol/sdk/client/sse.js';
import { useCallback, useEffect, useState } from 'react';
import { MCP_EXAMPLE_AGENT_CONFIG, MCP_EXAMPLE_AGENT_PARAMS, MCP_SERVER_URL } from '.';

/**
 * One time creation of reusable MCP client
 */
export function useMCPClient() {
  const [client, setClient] = useState<MCPClient | null>(null);

  const createClient = useCallback(() => {
    const transport = new SSEClientTransport(MCP_SERVER_URL);
    const mcpClient = new MCPClient(MCP_EXAMPLE_AGENT_CONFIG, MCP_EXAMPLE_AGENT_PARAMS);

    const connectClient = async () => {
      try {
        await mcpClient.connect(transport);

        setClient(mcpClient);
      } catch (error) {
        console.error('Error connecting client:', error);
      }
    };

    connectClient();

    return mcpClient;
  }, []);

  useEffect(() => {
    const client = createClient();

    return () => {
      client.close();
    };
  }, [createClient]);

  return client;
}

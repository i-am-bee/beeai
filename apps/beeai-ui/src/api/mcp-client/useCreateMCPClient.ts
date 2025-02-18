import { Client as MCPClient } from '@i-am-bee/acp-sdk/client/index.js';
import { SSEClientTransport } from '@i-am-bee/acp-sdk/client/sse.js';
import { useCallback, useEffect, useRef } from 'react';

/**
 * Provides a function to create MCP client on demand
 * and it manages closing previous connections
 */
export function useCreateMCPClient() {
  const clientRef = useRef<MCPClient | null>(null);

  useEffect(() => {
    return () => {
      // close on hook unmount
      clientRef.current?.close();
    };
  }, []);

  const createClient = useCallback(async () => {
    const transport = new SSEClientTransport(MCP_SERVER_URL);
    const client = new MCPClient(MCP_EXAMPLE_AGENT_CONFIG, MCP_EXAMPLE_AGENT_PARAMS);

    try {
      await client.connect(transport);

      clientRef.current?.close();
      clientRef.current = client;
    } catch (error) {
      console.error('Error connecting client:', error);
      return null;
    }

    return client;
  }, []);

  return createClient;
}

const MCP_SERVER_URL = new URL('/mcp/sse', location.href);
const MCP_EXAMPLE_AGENT_CONFIG = {
  name: 'example-client',
  version: '1.0.0',
};
const MCP_EXAMPLE_AGENT_PARAMS = {
  capabilities: {
    prompts: {},
    resources: {},
    tools: {},
  },
};

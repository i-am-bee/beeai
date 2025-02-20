/**
 * Copyright 2025 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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

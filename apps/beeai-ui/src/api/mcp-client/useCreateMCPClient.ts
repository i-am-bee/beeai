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
import { useCallback, useEffect, useRef, useState } from 'react';
import { ClientStatus } from './types';

/**
 * Provides a function to create MCP client on demand
 * and it manages closing previous connections
 */
export function useCreateMCPClient() {
  const [status, setStatus] = useState<ClientStatus>(ClientStatus.Idle);
  const clientRef = useRef<MCPClient | null>(null);
  const transportRef = useRef<SSEClientTransport | null>(null);
  const healthCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const closeClient = useCallback(async () => {
    const client = clientRef.current;
    const transport = transportRef.current;

    if (client && transport) {
      try {
        await client.close();
        await transport.close();
      } finally {
        clientRef.current = null;
        transportRef.current = null;

        setStatus(ClientStatus.Disconnected);
      }
    }
  }, []);

  const cleanup = useCallback(async () => {
    const healthCheckTimeout = healthCheckTimeoutRef.current;

    if (healthCheckTimeout) {
      clearInterval(healthCheckTimeout);
      healthCheckTimeoutRef.current = null;
    }

    try {
      await closeClient();
    } catch (error) {
      setStatus(ClientStatus.Error);

      console.error('MCPClient cleanup failed:', error);
    }
  }, [closeClient]);

  const startHealthCheck = useCallback((client: MCPClient) => {
    healthCheckTimeoutRef.current = setInterval(async () => {
      try {
        await client.ping();
      } catch (error) {
        setStatus(ClientStatus.Error);

        console.error('MCPClient health check failed. Trying to reconnect…', error);

        // TODO: Add reconnect
      }
    }, MCP_HEALTH_CHECK_DELAY);
  }, []);

  const createClient = useCallback(async () => {
    const transport = new SSEClientTransport(MCP_SERVER_URL);
    const client = new MCPClient(MCP_EXAMPLE_AGENT_CONFIG, MCP_EXAMPLE_AGENT_PARAMS);

    try {
      await cleanup();

      setStatus(ClientStatus.Connecting);

      await client.connect(transport);

      clientRef.current = client;
      transportRef.current = transport;

      setStatus(ClientStatus.Conected);

      startHealthCheck(client);
    } catch (error) {
      setStatus(ClientStatus.Error);

      console.error('MCPClient connecting failed:', error);

      // TODO: Add reconnect

      return null;
    }

    return client;
  }, [cleanup, startHealthCheck]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return { createClient, status };
}

const MCP_SERVER_URL = new URL('/mcp/sse', location.href);
const MCP_EXAMPLE_AGENT_CONFIG = {
  name: 'example-client',
  version: '1.0.0',
};
const MCP_EXAMPLE_AGENT_PARAMS = {
  capabilities: {},
};
const MCP_HEALTH_CHECK_DELAY = 1000;

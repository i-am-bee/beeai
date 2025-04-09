/**
 * Copyright 2025 © BeeAI a Series of LF Projects, LLC
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

import { Client as MCPClient } from '@i-am-bee/acp-sdk/client/index';
import { SSEClientTransport } from '@i-am-bee/acp-sdk/client/sse';
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
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);

  const closeClient = useCallback(async () => {
    const client = clientRef.current;
    const transport = transportRef.current;

    if (client && transport) {
      try {
        await client.close();
        await transport.close();
      } catch (error) {
        console.error('MCPClient closing failed:', error);
      } finally {
        clientRef.current = null;
        transportRef.current = null;

        setStatus(ClientStatus.Disconnected);
      }
    }
  }, []);

  const stopHealthCheck = useCallback(() => {
    const healthCheckInterval = healthCheckIntervalRef.current;

    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
      healthCheckIntervalRef.current = null;
    }
  }, []);

  const clearReconnectTimeout = useCallback(() => {
    const reconnectTimeout = reconnectTimeoutRef.current;

    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const cleanup = useCallback(async () => {
    stopHealthCheck();
    clearReconnectTimeout();

    await closeClient();
  }, [stopHealthCheck, clearReconnectTimeout, closeClient]);

  const createClient = useCallback(
    async ({ reconnectOnError = true }: { reconnectOnError?: boolean } = {}) => {
      const reconnect = () => {
        stopHealthCheck();
        clearReconnectTimeout();

        const delay = Math.min(RECONNECT_BASE_DELAY * 2 ** reconnectAttemptsRef.current, RECONNECT_MAX_DELAY);

        reconnectAttemptsRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(async () => {
          await createClient({ reconnectOnError });
        }, delay);
      };

      const startHealthCheck = () => {
        stopHealthCheck();

        healthCheckIntervalRef.current = setInterval(async () => {
          const client = clientRef.current;

          if (!client) {
            return;
          }

          try {
            await client.ping();
          } catch (error) {
            setStatus(ClientStatus.Error);

            console.error('MCPClient health check failed. Trying to reconnect…', error);

            reconnect();
          }
        }, HEALTH_CHECK_DELAY);
      };

      await cleanup();

      setStatus(ClientStatus.Connecting);

      const transport = new SSEClientTransport(MCP_SERVER_URL);
      const client = new MCPClient(MCP_EXAMPLE_AGENT_CONFIG, MCP_EXAMPLE_AGENT_PARAMS);

      try {
        await client.connect(transport);

        clientRef.current = client;
        transportRef.current = transport;

        setStatus(ClientStatus.Connected);

        reconnectAttemptsRef.current = 0;

        if (reconnectOnError) {
          startHealthCheck();
        }
      } catch (error) {
        setStatus(ClientStatus.Error);

        console.error('MCPClient connecting failed:', error);

        if (reconnectOnError) {
          reconnect();
        }
      }

      return clientRef.current;
    },
    [stopHealthCheck, clearReconnectTimeout, cleanup],
  );

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    client: clientRef.current,
    status,
    createClient,
    closeClient,
  };
}

const MCP_SERVER_URL = new URL('/mcp/sse', location.href);
const MCP_EXAMPLE_AGENT_CONFIG = {
  name: 'example-client',
  version: '1.0.0',
};
const MCP_EXAMPLE_AGENT_PARAMS = {
  capabilities: {},
};
const HEALTH_CHECK_DELAY = 10_000;
const RECONNECT_BASE_DELAY = 1_000;
const RECONNECT_MAX_DELAY = 30_000;

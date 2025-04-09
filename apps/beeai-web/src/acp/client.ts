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

import 'server-only';

import { Client } from '@i-am-bee/acp-sdk/client/index';
import { SSEClientTransport } from '@i-am-bee/acp-sdk/client/sse';
import type { ServerCapabilities } from '@i-am-bee/acp-sdk/types';
import { BodyInit, fetch as undiciFetch } from 'undici';

import { ACP_CLIENT_SERVER_URL } from '@/constants';

export async function getAcpClient() {
  if (!ACP_CLIENT_SERVER_URL) {
    throw new Error('ACP Transport has not been set');
  }

  const transport = new SSEClientTransport(new URL(ACP_CLIENT_SERVER_URL), {
    eventSourceInit: {
      // Use undici fetch instead of nextjs patched one, we don't want
      // any nextjs caching/deduping behaviour here.
      fetch: (url: string | URL, init?: RequestInit) =>
        undiciFetch(url, {
          ...init,
          body: init?.body ? (init.body as BodyInit) : undefined,
          // prevents nextjs switching pages from ISR to dynamic render
          cache: 'default',
        }),
    },
  });
  const client = new Client(ACP_EXAMPLE_AGENT_CONFIG, ACP_EXAMPLE_AGENT_PARAMS);
  await client.connect(transport);

  const capabilities = client.getServerCapabilities();
  assertServerCapability(capabilities, 'agents');

  return client;
}

function assertServerCapability(capabilities: ServerCapabilities | undefined, capability: keyof ServerCapabilities) {
  if (!capabilities?.[capability]) {
    throw new Error(`ACP Server does not support ${capability}`);
  }
}

const ACP_EXAMPLE_AGENT_CONFIG = {
  name: 'example-client',
  version: '1.0.0',
};
const ACP_EXAMPLE_AGENT_PARAMS = {
  capabilities: {},
};

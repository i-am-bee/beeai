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

import "server-only";
import { Client } from "@i-am-bee/acp-sdk/client/index";
import type { ServerCapabilities } from "@i-am-bee/acp-sdk/types";
import { SSEClientTransport } from "@i-am-bee/acp-sdk/client/sse";
import { ACP_CLIENT_SERVER_URL } from "@/constants";
import { getNativeFetch } from "./native-fetch";

export async function getAcpClient() {
  if (!ACP_CLIENT_SERVER_URL) {
    throw new Error("ACP Transport has not been set");
  }

  const transport = new SSEClientTransport(new URL(ACP_CLIENT_SERVER_URL), {
    eventSourceInit: {
      // Use native nodejs fetch instead of nextjs patched one, we don't want
      // any nextjs caching/deduping behaviour here.
      fetch: getNativeFetch(),
    },
  });
  const client = new Client(ACP_EXAMPLE_AGENT_CONFIG, ACP_EXAMPLE_AGENT_PARAMS);
  await client.connect(transport);

  const capabilities = client.getServerCapabilities();
  assertServerCapability(capabilities, "agents");

  return client;
}

function assertServerCapability(
  capabilities: ServerCapabilities | undefined,
  capability: keyof ServerCapabilities
) {
  if (!capabilities?.[capability]) {
    throw new Error(`ACP Server does not support ${capability}`);
  }
}

const ACP_EXAMPLE_AGENT_CONFIG = {
  name: "example-client",
  version: "1.0.0",
};
const ACP_EXAMPLE_AGENT_PARAMS = {
  capabilities: {},
};

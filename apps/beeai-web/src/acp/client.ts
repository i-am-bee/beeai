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
import { Client } from "@i-am-bee/acp-sdk/client/index.js";
import { SSEClientTransport } from "@i-am-bee/acp-sdk/client/sse.js";
import { ACP_SERVER_URL } from "@/constants";

export async function getAcpClient() {
  const transport = new SSEClientTransport(ACP_SSE_TRANSPORT_URL);
  const client = new Client(ACP_EXAMPLE_AGENT_CONFIG, ACP_EXAMPLE_AGENT_PARAMS);
  await client.connect(transport);
  return client;
}

const ACP_SSE_TRANSPORT_URL = new URL("/mcp/sse", ACP_SERVER_URL);
const ACP_EXAMPLE_AGENT_CONFIG = {
  name: "example-client",
  version: "1.0.0",
};
const ACP_EXAMPLE_AGENT_PARAMS = {
  capabilities: {
    prompts: {},
    resources: {},
    tools: {},
  },
};

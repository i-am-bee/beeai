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

import { PropsWithChildren, useEffect, useState } from 'react';
import { MCPClientContext } from './mcp-client-context';
import { useCreateMCPClient } from '#api/mcp-client/useCreateMCPClient.ts';
import { Client as MCPClient } from '@i-am-bee/acp-sdk/client/index';

export function MCPClientProvider({ children }: PropsWithChildren) {
  const [client, setClient] = useState<MCPClient | null>(null);

  const createClient = useCreateMCPClient();

  useEffect(() => {
    createClient().then((client) => setClient(client));
  }, [createClient]);

  return <MCPClientContext.Provider value={client}>{children}</MCPClientContext.Provider>;
}

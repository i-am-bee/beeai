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

import { getAcpClient } from "@/acp/client";
import { Container, ViewStack } from "@i-am-bee/beeai-ui";
import { unstable_cache } from "next/cache";
import { AgentsView } from "./AgentsView";

export default async function AgentsPage() {
  const agents = await getAgentsList();
  return (
    <Container>
      <ViewStack>
        <AgentsView agents={agents} />
      </ViewStack>
    </Container>
  );
}

const getAgentsList = unstable_cache(
  async () => {
    const client = await getAcpClient();

    const { agents } = await client.listAgents();

    await client.close();

    return agents;
  },
  undefined,
  // ISR can be added like this
  // { revalidate: 30 }
);

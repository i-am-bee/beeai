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

import { getAgentsList } from '@/acp/api';
import { NEXT_PHASE_BUILD } from '@/constants';
import { MainContent } from '@/layouts/MainContent';
import { initializeAgentRoutes } from '@/utils/initializeAgentRoutes';
import { Container, ViewStack } from '@i-am-bee/beeai-ui';
import { AgentsFilteredView } from './AgentsFilteredView';

export const revalidate = 600;

export default async function AgentsPage() {
  let agents = null;

  // Bypass API calls at build time since the ACP server is not reachable.
  // The page is revalidated on the first request via `api/init-agents`.
  // From then on, the proper agents list is loaded and revalidated every 10 minutes.
  if (!NEXT_PHASE_BUILD) {
    try {
      agents = await getAgentsList();
    } catch (error) {
      initializeAgentRoutes();

      console.error(error);
    }
  }

  return (
    <MainContent>
      <Container>
        <ViewStack>
          <AgentsFilteredView agents={agents} />
        </ViewStack>
      </Container>
    </MainContent>
  );
}

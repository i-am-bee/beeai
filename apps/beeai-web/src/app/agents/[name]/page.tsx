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

import { AgentDetail, Container, TryLocallyButton } from '@i-am-bee/beeai-ui';
import { notFound } from 'next/navigation';

import { fetchAgentsList } from '@/api/fetchAgentsList';
import { MainContent } from '@/layouts/MainContent';

interface Props {
  params: Promise<{ name: string }>;
}

export default async function AgentPage({ params }: Props) {
  const { name } = await params;
  const agents = await fetchAgentsList();
  const agent = agents.find((agent) => agent.name === name);
  if (!agent) {
    notFound();
  }

  return (
    <MainContent>
      <Container>
        <AgentDetail agent={agent} buttons={<TryLocallyButton />} />
      </Container>
    </MainContent>
  );
}

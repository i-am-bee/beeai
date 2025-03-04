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

import { getAgentsList } from "@/acp/api";
import { MainContent } from "@/components/layouts/MainContent";
import { AgentDetail, Container } from "@i-am-bee/beeai-ui";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic"; // Opt out of static generation

interface Props {
  params: Promise<{ name: string }>;
}

export default async function AgentPage({ params }: Props) {
  const { name } = await params;
  const agents = await getAgentsList();
  const agent = agents.find((agent) => agent.name === name);
  if (!agent) {
    notFound();
  }

  return (
    <MainContent>
      <Container>
        <AgentDetail agent={agent} />
      </Container>
    </MainContent>
  );
}

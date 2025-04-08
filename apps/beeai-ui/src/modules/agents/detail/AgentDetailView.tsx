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

import { ErrorMessage } from '#components/ErrorMessage/ErrorMessage.tsx';

import { useAgent } from '../api/queries/useAgent';
import { AgentDetail } from '../components/AgentDetail';
import { AgentLaunchButton } from './AgentLaunchButton';

interface Props {
  name: string;
}

export function AgentDetailView({ name }: Props) {
  const { data: agent, isPending, error, refetch, isRefetching } = useAgent({ name });
  if (isPending) {
    return <AgentDetail.Skeleton />;
  }
  if (!agent) {
    return (
      <ErrorMessage
        title="Failed to load the agent."
        onRetry={refetch}
        isRefetching={isRefetching}
        subtitle={error?.message}
      />
    );
  }
  return <AgentDetail agent={agent} buttons={<AgentLaunchButton agent={agent} />} />;
}

import { Container } from '@/components/layouts/Container';
import { ViewStack } from '@/components/ViewStack/ViewStack';
import { AgentsFilters } from '@/modules/agents/components/AgentsFilters';
import { AgentsList } from '@/modules/agents/components/AgentsList';

import { AgentsProvider } from '@/modules/agents/contexts/AgentsProvider';

export function Agents() {
  return (
    <Container>
      <ViewStack>
        <AgentsProvider>
          <AgentsFilters />

          <AgentsList />
        </AgentsProvider>
      </ViewStack>
    </Container>
  );
}

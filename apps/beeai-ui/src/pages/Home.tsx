import { Container } from '@/components/layouts/Container';
import { ViewHeader } from '@/components/ViewHeader';
import { ViewStack } from '@/components/ViewStack';
import { AgentsFilters } from '@/modules/agents/components/AgentsFilters';
import { AgentsList } from '@/modules/agents/components/AgentsList';
import { AgentsProvider } from '@/modules/agents/contexts/AgentsProvider';
import { Add } from '@carbon/icons-react';
import { Button } from '@carbon/react';

export function Home() {
  return (
    <Container>
      <ViewStack>
        <ViewHeader heading="Agents">
          {/* TODO: Add functionality */}
          <Button kind="tertiary" size="md" renderIcon={Add}>
            Import agents
          </Button>
        </ViewHeader>

        <AgentsProvider>
          <AgentsFilters />

          <AgentsList />
        </AgentsProvider>
      </ViewStack>
    </Container>
  );
}

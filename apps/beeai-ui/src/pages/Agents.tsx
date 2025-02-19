import { Container } from '@/components/layouts/Container';
import { ViewHeader } from '@/components/ViewHeader/ViewHeader';
import { ViewStack } from '@/components/ViewStack/ViewStack';
import { useModal } from '@/contexts/Modal';
import { AgentsFilters } from '@/modules/agents/components/AgentsFilters';
import { AgentsList } from '@/modules/agents/components/AgentsList';
import { ImportAgentsModal } from '@/modules/agents/components/ImportAgentsModal';
import { AgentsProvider } from '@/modules/agents/contexts/AgentsProvider';
import { Add } from '@carbon/icons-react';
import { Button } from '@carbon/react';

export function Agents() {
  const { openModal } = useModal();

  return (
    <Container>
      <ViewStack>
        <ViewHeader heading="Agents">
          <Button
            kind="tertiary"
            size="md"
            renderIcon={Add}
            onClick={() => openModal((props) => <ImportAgentsModal {...props} />)}
          >
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

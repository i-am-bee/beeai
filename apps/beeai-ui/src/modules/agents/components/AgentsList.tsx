import { ErrorMessage } from '@/components/ErrorMessage/ErrorMessage';
import { useModal } from '@/contexts/Modal';
import { ImportAgentsModal } from '@/modules/agents/components/ImportAgentsModal';
import { Add } from '@carbon/icons-react';
import { Button } from '@carbon/react';
import pluralize from 'pluralize';
import { useFormContext } from 'react-hook-form';
import { useAgents } from '../contexts';
import { AgentsFiltersParams } from '../contexts/agents-context';
import { useFilteredAgents } from '../hooks/useFilteredAgents';
import { AgentCard } from './AgentCard';
import classes from './AgentsList.module.scss';

export function AgentsList() {
  const { openModal } = useModal();
  const {
    agentsQuery: { data, isPending, error, refetch, isRefetching },
  } = useAgents();
  const { watch } = useFormContext<AgentsFiltersParams>();
  const filters = watch();

  const { filteredAgents, filteredCount } = useFilteredAgents({ agents: data ?? [], filters });
  const totalCount = data?.length ?? 0;

  if (error && !data)
    return (
      <ErrorMessage
        title="Failed to load agents."
        onRetry={refetch}
        isRefetching={isRefetching}
        subtitle={error.message}
      />
    );

  return (
    <div>
      <div className={classes.header}>
        {totalCount > 0 && (
          <p className={classes.count}>
            Showing {totalCount === filteredCount ? totalCount : `${filteredCount} of ${totalCount}`}{' '}
            {pluralize('agent', totalCount)}
          </p>
        )}

        <Button
          kind="tertiary"
          size="md"
          renderIcon={Add}
          onClick={() => openModal((props) => <ImportAgentsModal {...props} />)}
        >
          Import agents
        </Button>
      </div>

      <ul className={classes.list}>
        {!isPending
          ? filteredAgents?.map((agent, idx) => (
              <li key={idx}>
                <AgentCard agent={agent} />
              </li>
            ))
          : Array.from({ length: 3 }, (_, idx) => (
              <li key={idx}>
                <AgentCard.Skeleton />
              </li>
            ))}
      </ul>
    </div>
  );
}

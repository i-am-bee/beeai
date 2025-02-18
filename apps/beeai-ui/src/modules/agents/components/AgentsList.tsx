import { useMemo } from 'react';
import { useAgents } from '../contexts';
import { AgentCard } from './AgentCard';
import classes from './AgentsList.module.scss';
import { useFormContext } from 'react-hook-form';
import { FilterFormValues } from '../contexts/agents-context';
import { ErrorMessage } from '@/components/ErrorMessage/ErrorMessage';

export function AgentsList() {
  const {
    agentsQuery: { data, isPending, error, refetch, isRefetching },
  } = useAgents();
  const { watch } = useFormContext<FilterFormValues>();

  const filterValues = watch();

  const filteredAgents = useMemo(() => {
    const { frameworks, search } = filterValues;

    return data
      ?.filter((agent) => {
        if (frameworks.length && !frameworks.includes(agent.framework ?? '')) {
          return false;
        }

        if (search && !new RegExp(`${search}`, 'i').test(agent.name)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data, filterValues]);

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
      <ul className={classes.root}>
        {!isPending
          ? filteredAgents?.map((agent, idx) => (
              <li key={idx}>
                <AgentCard agent={agent} />
              </li>
            ))
          : Array.from({ length: 3 }, (_, i) => <AgentCard.Skeleton key={i} />)}
        <li></li>
      </ul>
    </div>
  );
}

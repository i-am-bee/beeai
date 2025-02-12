import { useMemo } from 'react';
import { useAgents } from '../contexts';
import { AgentCard } from './AgentCard';
import classes from './AgentsList.module.scss';
import { useFormContext } from 'react-hook-form';
import { FilterFormValues } from '../contexts/AgentsContext';

export function AgentsList() {
  // TODO: handle error
  const {
    agentsQuery: { data, isPending },
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

  return (
    <div>
      <ul className={classes.root}>
        {!isPending
          ? filteredAgents?.map((agent, idx) => (
              <li key={idx}>
                <AgentCard agent={agent} />
              </li>
            ))
          : Array.from({ length: 8 }, (_, i) => <AgentCard.Skeleton key={i} />)}
        <li></li>
      </ul>
    </div>
  );
}

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
    const { authors, search } = filterValues;

    return data?.filter((agent) => {
      if (authors.length && !authors.includes(agent.metadata?.author ?? '')) {
        return false;
      }

      if (search && !new RegExp(`${search}`, 'i').test(agent.name)) {
        return false;
      }

      return true;
    });
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

// const TEMP_DUMMY_DATA = [
//   {
//     name: 'Chat with transcript',
//     description:
//       'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Deleniti facere est dolor, et dicta blanditiis earum culpa dolores modi id possimus, beatae sit ipsam ex cum voluptates, facilis quidem unde? Lorem, ipsum dolor sit amet consectetur adipisicing elit. Deleniti facere est dolor, et dicta blanditiis earum culpa dolores modi id possimus, beatae sit ipsam ex cum voluptates, facilis quidem unde? Lorem, ipsum dolor sit amet consectetur adipisicing elit. Deleniti facere est dolor, et dicta blanditiis earum culpa dolores modi id possimus, beatae sit ipsam ex cum voluptates, facilis quidem unde?',
//     metadata: {
//       avgRunTime: 5,
//       avgRunTokens: 24,
//       author: 'BeeAI',
//     },
//   },
//   {
//     name: 'Competitive analysis',
//     description: 'Ask a question about using Bee',
//   },
//   {
//     name: 'Blog writer',
//     description: 'Share your meeting transcript and ask questions or request a summary',
//   },
//   {
//     name: 'Bee assistant',
//     description: 'A general purpose helpful agent',
//   },
// ] as Agent[];

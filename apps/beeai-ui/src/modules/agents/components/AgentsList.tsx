import { useListAgents } from '../api/queries/useListAgents';
import { Agent } from '../api/types';
import { AgentCard } from './AgentCard';
import classes from './AgentsList.module.scss';

export function AgentsList() {
  const { data, isPending } = useListAgents();

  console.log(data, isPending);

  return (
    <ul className={classes.root}>
      {TEMP_DUMMY_DATA.map((agent, idx) => (
        <li key={idx}>
          <AgentCard agent={agent} />
        </li>
      ))}
      <li>
        <AgentCard.Skeleton />
      </li>
    </ul>
  );
}

const TEMP_DUMMY_DATA = [
  {
    name: 'Chat with transcript',
    description:
      'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Deleniti facere est dolor, et dicta blanditiis earum culpa dolores modi id possimus, beatae sit ipsam ex cum voluptates, facilis quidem unde? Lorem, ipsum dolor sit amet consectetur adipisicing elit. Deleniti facere est dolor, et dicta blanditiis earum culpa dolores modi id possimus, beatae sit ipsam ex cum voluptates, facilis quidem unde? Lorem, ipsum dolor sit amet consectetur adipisicing elit. Deleniti facere est dolor, et dicta blanditiis earum culpa dolores modi id possimus, beatae sit ipsam ex cum voluptates, facilis quidem unde?',
  },
  {
    name: 'Competitive analysis',
    description: 'Ask a question about using Bee',
  },
  {
    name: 'Blog writer',
    description: 'Share your meeting transcript and ask questions or request a summary',
  },
  {
    name: 'Bee assistant',
    description: 'A general purpose helpful agent',
  },
] as Agent[];

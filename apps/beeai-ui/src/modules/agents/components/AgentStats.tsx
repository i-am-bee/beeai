import { Agent } from '../api/types';
import classes from './AgentStats.module.scss';

export function AgentStats({ agent }: { agent: Agent }) {
  return (
    <ul className={classes.root}>
      {agent.metadata?.avgRunTime && <li>{agent.metadata.avgRunTime}s/run (avg)</li>}
      {agent.metadata?.avgRunTokens && <li>{agent.metadata.avgRunTokens} tokens/run (avg)</li>}
    </ul>
  );
}

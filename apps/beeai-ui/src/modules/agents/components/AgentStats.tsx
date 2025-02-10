import { Agent } from '../api/types';
import classes from './AgentStats.module.scss';

export function AgentStats({ agent }: { agent: Agent }) {
  // TODO: data from agent
  console.debug(agent);

  return <p className={classes.root}>50s/run (avg) | 50 tokens/run (avg) | OpenAI</p>;
}

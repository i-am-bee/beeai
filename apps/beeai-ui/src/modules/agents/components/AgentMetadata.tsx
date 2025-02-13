import { Time } from '@carbon/icons-react';
import { Agent } from '../api/types';
import classes from './AgentMetadata.module.scss';

export function AgentMetadata({ agent }: { agent: Agent }) {
  const { avgRunTimeSeconds, avgRunTokens, licence } = agent;

  return (
    <ul className={classes.root}>
      {avgRunTimeSeconds && (
        <li>
          <Time />
          {avgRunTimeSeconds}s/run (avg)
        </li>
      )}
      {avgRunTokens && <li>{avgRunTokens} tokens/run (avg)</li>}
      {licence && <li>{licence}</li>}
    </ul>
  );
}

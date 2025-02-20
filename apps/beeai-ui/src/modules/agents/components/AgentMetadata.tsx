import { Time } from '@carbon/icons-react';
import { SkeletonText } from '@carbon/react';
import clsx from 'clsx';
import { Agent } from '../api/types';
import classes from './AgentMetadata.module.scss';

interface Props {
  agent: Agent;
  className?: string;
}

export function AgentMetadata({ agent, className }: Props) {
  const { avgRunTimeSeconds, avgRunTokens, licence } = agent;

  return (
    <ul className={clsx(classes.root, className)}>
      {avgRunTimeSeconds && (
        <li className={classes.item}>
          <Time />
          {avgRunTimeSeconds}s/run (avg)
        </li>
      )}
      {avgRunTokens && <li className={classes.item}>{avgRunTokens} tokens/run (avg)</li>}
      {licence && <li className={classes.item}>{licence}</li>}
    </ul>
  );
}

interface SkeletonProps {
  className?: string;
}

AgentMetadata.Skeleton = function AgentMetadataSkeleton({ className }: SkeletonProps) {
  return <SkeletonText className={clsx(classes.root, className)} width="33%" />;
};

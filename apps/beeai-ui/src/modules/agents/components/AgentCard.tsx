import { TagsList } from '@/components/TagsList';
import { LogoGithub } from '@carbon/icons-react';
import { SkeletonText, Tag } from '@carbon/react';
import { Link } from 'react-router';
import { Agent } from '../api/types';
import classes from './AgentCard.module.scss';

interface Props {
  agent: Agent;
}

export function AgentCard({ agent }: Props) {
  const { name, description } = agent;

  return (
    <article className={classes.root}>
      <div className={classes.header}>
        <h2 className={classes.name}>
          {/* TODO: Link */}
          <Link to="/" className={classes.link}>
            {name}
          </Link>
        </h2>

        {description && <p className={classes.description}>{description}</p>}
      </div>

      {/* TODO: Tags and metadata */}
      <div className={classes.footer}>
        <TagsList
          tags={[
            <Tag type="cool-gray">BeeAI Framework</Tag>,
            <Tag type="cool-gray" renderIcon={LogoGithub} />,
            <Tag type="green">Example</Tag>,
          ]}
        />

        <p className={classes.metadata}>50s/run (avg) | 50 tokens/run (avg) | OpenAI</p>
      </div>
    </article>
  );
}

AgentCard.Skeleton = function AgentCardSkeleton() {
  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <SkeletonText className={classes.name} width="50%" />

        <SkeletonText className={classes.description} paragraph lineCount={2} />
      </div>

      <div className={classes.footer}>
        <TagsList.Skeleton length={2} />

        <SkeletonText className={classes.metadata} width="33%" />
      </div>
    </div>
  );
};

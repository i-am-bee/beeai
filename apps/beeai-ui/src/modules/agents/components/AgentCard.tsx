import { TagsList } from '@/components/TagsList';
import { SkeletonText } from '@carbon/react';
import { Link, useNavigate } from 'react-router';
import { Agent } from '../api/types';
import classes from './AgentCard.module.scss';
import { AgentStats } from './AgentStats';
import { AgentTags } from './AgentTags';
import Markdown from 'react-markdown';
import { routes } from '@/utils/router';

interface Props {
  agent: Agent;
}

export function AgentCard({ agent }: Props) {
  const { name, description } = agent;
  // const { openModal } = useModal();
  const navigate = useNavigate();

  return (
    <article
      className={classes.root}
      onClick={() => navigate(routes.agentDetail(agent.id))}
      // onClick={() => openModal((props) => <AgentModal {...props} agent={agent} />)}
    >
      <div className={classes.header}>
        <h2 className={classes.name}>
          {/* TODO: Link */}
          <Link to="/" className={classes.link}>
            {name}
          </Link>
        </h2>

        {description && <Markdown className={classes.description}>{description}</Markdown>}
      </div>

      {/* TODO: Tags and metadata */}
      <div className={classes.footer}>
        <AgentTags agent={agent} />

        <AgentStats agent={agent} />
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

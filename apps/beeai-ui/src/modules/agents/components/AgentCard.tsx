import { MarkdownContent } from '@/components/MarkdownContent/MarkdownContent';
import { TagsList } from '@/components/TagsList/TagsList';
import { routes } from '@/utils/router';
import { SkeletonText } from '@carbon/react';
import { Link } from 'react-router';
import { Agent } from '../api/types';
import classes from './AgentCard.module.scss';
import { AgentMetadata } from './AgentMetadata';
import { AgentTags } from './AgentTags';

interface Props {
  agent: Agent;
}

export function AgentCard({ agent }: Props) {
  const { name, title, description } = agent;
  // const { openModal } = useModal();

  const route = routes.agentDetail(agent.name);

  return (
    <article
      className={classes.root}
      // TODO: Remove, including AgentModal file, if the modal view is not used in the final UI
      // onClick={() => openModal((props) => <AgentModal {...props} agent={agent} />)}
    >
      <div className={classes.header}>
        <h2 className={classes.name}>
          <Link to={route} className={classes.link} viewTransition>
            {title ?? name}
          </Link>
        </h2>

        {description && <MarkdownContent className={classes.description}>{description}</MarkdownContent>}
      </div>

      <div className={classes.footer}>
        <AgentTags agent={agent} />

        <AgentMetadata agent={agent} />
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

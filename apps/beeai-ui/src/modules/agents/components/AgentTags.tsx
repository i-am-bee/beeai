import { TagsList } from '@/components/TagsList';
import { Agent } from '../api/types';
import { Tag } from '@carbon/react';
import { isNotNull } from '@/utils/helpers';
import Bee from '@/svgs/Bee.svg';

export function AgentTags({ agent }: { agent: Agent }) {
  const author = agent.metadata?.author;
  const isBeeAI = author === 'BeeAI';

  return (
    <TagsList
      tags={[
        agent.metadata?.author ? (
          <Tag type={isBeeAI ? 'green' : 'cool-gray'} renderIcon={isBeeAI ? Bee : undefined}>
            {author}
          </Tag>
        ) : null,
      ].filter(isNotNull)}
    />
  );
}

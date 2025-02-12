import { TagsList } from '@/components/TagsList';
import { Agent } from '../api/types';
import { Tag } from '@carbon/react';
import Bee from '@/svgs/Bee.svg';
import { isNotNull } from '@/utils/helpers';

export function AgentTags({ agent }: { agent: Agent }) {
  const { framework } = agent;

  return <TagsList tags={[framework ? <AgentTag name={framework} /> : null].filter(isNotNull)} />;
}

function AgentTag({ name }: { name: string }) {
  return name === 'BeeAI' ? (
    <Tag type="green" renderIcon={Bee}>
      {name}
    </Tag>
  ) : (
    <Tag type="cool-gray">{name}</Tag>
  );
}

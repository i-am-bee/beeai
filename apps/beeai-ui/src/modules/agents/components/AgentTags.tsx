import { TagsList } from '@/components/TagsList';
import { Agent } from '../api/types';
import { Tag } from '@carbon/react';
import { LogoGithub } from '@carbon/icons-react';

export function AgentTags({ agent }: { agent: Agent }) {
  
  // TODO: data from agent
  console.debug(agent);

  return (
    <TagsList
      tags={[
        <Tag type="cool-gray">BeeAI Framework</Tag>,
        <Tag type="cool-gray" renderIcon={LogoGithub} />,
        <Tag type="green">Example</Tag>,
      ]}
    />
  );
}

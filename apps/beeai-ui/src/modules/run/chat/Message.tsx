import clsx from 'clsx';
import classes from './Message.module.scss';
import { useChat } from '../contexts';
import { getAgentTitle } from '@/modules/agents/utils';
import { AgentIcon } from './AgentIcon';
import { UserIcon } from './UserIcon';
import { Spinner } from '@/components/Spinner/Spinner';
import { ErrorMessage } from '@/components/ErrorMessage/ErrorMessage';
import { ChatMessage } from './types';

interface Props {
  message: ChatMessage;
}

export function Message({ message }: Props) {
  const { agent } = useChat();

  const isUserMessage = message.role === 'user';

  return (
    <li className={clsx(classes.root)}>
      <div className={classes.sender}>
        <div className={classes.senderIcon}>{isUserMessage ? <UserIcon /> : <AgentIcon />}</div>
        <div className={classes.senderName}>{isUserMessage ? 'User' : getAgentTitle(agent)}</div>
      </div>

      <div className={classes.body}>
        {!isUserMessage && message.status === 'pending' && !message.content ? (
          <Spinner />
        ) : !isUserMessage && message.error && message.status === 'error' ? (
          <ErrorMessage title="Failed to generate a response message" subtitle={message.error.message} />
        ) : (
          <div className={classes.content}>
            {message.content || <span className={classes.empty}>Message has no content</span>}
          </div>
        )}
      </div>
    </li>
  );
}

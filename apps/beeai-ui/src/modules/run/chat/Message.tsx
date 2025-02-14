import clsx from 'clsx';
import { ChatMessage } from '../contexts/ChatContext';
import classes from './Message.module.scss';
import { useChat } from '../contexts';
import { getAgentTitle } from '@/modules/agents/utils';
import { AgentIcon } from './AgentIcon';
import { UserIcon } from './UserIcon';
import { Spinner } from '@/components/Spinner/Spinner';
import { ErrorMessage } from '@/components/ErrorMessage/ErrorMessage';

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
        {!isUserMessage && message.isPending && !message.content ? (
          <Spinner />
        ) : message.error ? (
          <ErrorMessage title="Failed to load agents." subtitle={message.error.message} />
        ) : (
          <div className={classes.content}>{message.content}</div>
        )}
      </div>
    </li>
  );
}

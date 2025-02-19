import { PropsWithChildren, useCallback, useMemo, useRef } from 'react';
import { ChatContext, ChatMessagesContext } from './chat-context';
import { Agent } from '@/modules/agents/api/types';
import { v4 as uuid } from 'uuid';
import { useImmerWithGetter } from '@/hooks/useImmerWithGetter';
import { MessageInput } from '@i-am-bee/beeai-sdk/schemas/message';
import { useRunAgent } from '../api/mutations/useRunAgent';
import { AgentMessage, ChatMessage } from '../chat/types';
import { MessagesNotifications, messagesNotificationsSchema, MessagesResult } from '../chat/types';

interface Props {
  agent: Agent;
}

export function ChatProvider({ agent, children }: PropsWithChildren<Props>) {
  const [messages, getMessages, setMessages] = useImmerWithGetter<ChatMessage[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);

  const updateLastAgentMessage = useCallback(
    (updater: (message: AgentMessage) => void) => {
      setMessages((messages) => {
        const lastMessage = messages.at(-1);
        if (lastMessage?.role === 'assistant') {
          updater(lastMessage);
        }
      });
    },
    [setMessages],
  );

  const { runAgent, isPending } = useRunAgent<MessageInput, MessagesNotifications>({
    agent,
    notifications: {
      schema: messagesNotificationsSchema,
      handler: (notification) => {
        const text = String(notification.params.delta.messages.at(-1)?.content);
        updateLastAgentMessage((message) => {
          message.content += text;
        });
      },
    },
  });

  const getInputMessages = useCallback(() => {
    return getMessages()
      .slice(0, -1)
      .map(({ role, content }) => ({ role, content }));
  }, [getMessages]);

  const sendMessage = useCallback(
    async (input: string) => {
      setMessages((messages) => {
        messages.push({
          key: uuid(),
          role: 'user',
          content: input,
        });
        messages.push({
          key: uuid(),
          role: 'assistant',
          content: '',
          status: 'pending',
        });
      });

      try {
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        const response = (await runAgent({
          input: {
            messages: getInputMessages(),
          },
          abortController,
        })) as MessagesResult;

        updateLastAgentMessage((message) => {
          message.content = String(response.output.messages.at(-1)?.content);
          message.status = 'success';
        });
      } catch (error) {
        console.error(error);

        updateLastAgentMessage((message) => {
          message.error = error as Error;
          message.status = abortControllerRef.current?.signal.aborted ? 'aborted' : 'error';
        });
      }
    },
    [getInputMessages, runAgent, setMessages, updateLastAgentMessage],
  );

  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const handleClear = useCallback(() => {
    setMessages([]);
    handleCancel();
  }, [handleCancel, setMessages]);

  const contextValue = useMemo(
    () => ({
      agent,
      isPending,
      onCancel: handleCancel,
      getMessages,
      setMessages,
      onClear: handleClear,
      sendMessage,
    }),
    [agent, getMessages, handleCancel, handleClear, isPending, sendMessage, setMessages],
  );

  return (
    <ChatContext.Provider value={contextValue}>
      <ChatMessagesContext.Provider value={messages}>{children}</ChatMessagesContext.Provider>
    </ChatContext.Provider>
  );
}

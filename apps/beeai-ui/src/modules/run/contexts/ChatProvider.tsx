import { PropsWithChildren, useCallback, useMemo, useRef } from 'react';
import { AgentMessage, ChatContext, ChatMessage, ChatMessagesContext } from './ChatContext';
import { Agent } from '@/modules/agents/api/types';
import { v4 as uuid } from 'uuid';
import { useSendMessage } from '../chat/api/mutations/useSendMessage';
import { useImmerWithGetter } from '@/hooks/useImmerWithGetter';

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
        if (lastMessage?.role === 'agent') {
          updater(lastMessage);
        }
      });
    },
    [setMessages],
  );

  const { mutateAsync: mutateSendMessage, isPending } = useSendMessage({
    onMessageDelta: (delta: string) => {
      updateLastAgentMessage((message) => {
        message.content += delta;
      });
    },
  });

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
          role: 'agent',
          content: '',
          isPending: true,
        });
      });

      try {
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        const response = await mutateSendMessage({ input, agent });

        updateLastAgentMessage((message) => {
          message.content = String(response.output.text);
        });
      } catch (error) {
        console.error(error);

        updateLastAgentMessage((message) => {
          message.error = error as Error;
        });
      } finally {
        updateLastAgentMessage((message) => {
          message.isPending = false;
        });
      }
    },
    [agent, mutateSendMessage, setMessages, updateLastAgentMessage],
  );

  const contextValue = useMemo(
    () => ({
      agent,
      isPending,
      getMessages,
      setMessages,
      onClear: () => setMessages([]),
      sendMessage,
    }),
    [agent, getMessages, isPending, sendMessage, setMessages],
  );

  return (
    <ChatContext.Provider value={contextValue}>
      <ChatMessagesContext.Provider value={messages}>{children}</ChatMessagesContext.Provider>
    </ChatContext.Provider>
  );
}

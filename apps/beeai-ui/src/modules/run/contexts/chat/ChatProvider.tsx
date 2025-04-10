/**
 * Copyright 2025 © BeeAI a Series of LF Projects, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { MessageInput } from '@i-am-bee/beeai-sdk/schemas/message';
import type { PropsWithChildren } from 'react';
import { useCallback, useMemo, useRef } from 'react';
import { v4 as uuid } from 'uuid';

import { useImmerWithGetter } from '#hooks/useImmerWithGetter.ts';
import type { Agent } from '#modules/agents/api/types.ts';
import { useRunAgent } from '#modules/run/api/mutations/useRunAgent.tsx';
import type { MessagesNotificationSchema, MessagesResult } from '#modules/run/api/types.ts';
import type { AgentMessage, ChatMessage, SendMessageParams } from '#modules/run/chat/types.ts';

import { ChatContext, ChatMessagesContext } from './chat-context';

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

  const { runAgent, isPending } = useRunAgent<MessageInput, MessagesNotificationSchema>({
    notifications: {
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
    async ({ input, config }: SendMessageParams) => {
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
          agent,
          input: {
            messages: getInputMessages(),
            config,
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
    [agent, getInputMessages, runAgent, setMessages, updateLastAgentMessage],
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

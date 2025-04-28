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

import type { PropsWithChildren } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';

import { useImmerWithGetter } from '#hooks/useImmerWithGetter.ts';
import type { Agent } from '#modules/agents/api/types.ts';
import { useCancelRun } from '#modules/runs/api/mutations/useCancelRun.tsx';
import { useCreateRunStream } from '#modules/runs/api/mutations/useCreateRunStream.tsx';
import { EventType, type RunId, type SessionId } from '#modules/runs/api/types.ts';
import {
  type AssistantMessage,
  type ChatMessage,
  MessageStatus,
  type SendMessageParams,
} from '#modules/runs/chat/types.ts';
import { Role } from '#modules/runs/types.ts';
import { createMessagePart, createRunStreamRequest, handleRunStream, isArtifact } from '#modules/runs/utils.ts';

import { ChatContext, ChatMessagesContext } from './chat-context';

interface Props {
  agent: Agent;
}

export function ChatProvider({ agent, children }: PropsWithChildren<Props>) {
  const [messages, , setMessages] = useImmerWithGetter<ChatMessage[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [runId, setRunId] = useState<RunId>();
  const [sessionId, setSessionId] = useState<SessionId>();

  const abortControllerRef = useRef<AbortController | null>(null);

  const updateLastAssistantMessage = useCallback(
    (updater: (message: AssistantMessage) => void) => {
      setMessages((messages) => {
        const lastMessage = messages.at(-1);

        if (lastMessage?.role === Role.Assistant) {
          updater(lastMessage);
        }
      });
    },
    [setMessages],
  );

  const { mutateAsync: createRunStream } = useCreateRunStream();

  const { mutate: cancelRun } = useCancelRun();

  const sendMessage = useCallback(
    async ({ input }: SendMessageParams) => {
      setMessages((messages) => {
        messages.push({
          key: uuid(),
          role: Role.User,
          content: input,
        });
        messages.push({
          key: uuid(),
          role: Role.Assistant,
          content: '',
          status: MessageStatus.InProgress,
        });
      });

      try {
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        const stream = await createRunStream({
          body: createRunStreamRequest({
            agent: agent.name,
            messagePart: createMessagePart({ content: input }),
            sessionId,
          }),
          signal: abortController.signal,
        });

        setIsPending(true);

        handleRunStream({
          stream,
          onEvent: (event) => {
            switch (event.type) {
              case EventType.RunCreated:
                setRunId(event.run.run_id);
                setSessionId(event.run.session_id);

                break;
              case EventType.RunFailed:
                setIsPending(false);

                throw new Error(event.run.error?.message);
              case EventType.RunCancelled:
                setIsPending(false);

                break;
              case EventType.RunCompleted:
                setIsPending(false);

                break;
              case EventType.MessagePart:
                if (isArtifact(event.part)) {
                  return;
                }

                updateLastAssistantMessage((message) => {
                  message.content += event.part.content;
                });

                break;
              case EventType.MessageCompleted:
                updateLastAssistantMessage((message) => {
                  message.status = MessageStatus.Completed;
                });
            }
          },
        });
      } catch (error) {
        updateLastAssistantMessage((message) => {
          message.error = error as Error;
          message.status = MessageStatus.Failed;
        });
      }
    },
    [agent.name, sessionId, createRunStream, setMessages, updateLastAssistantMessage],
  );

  const handleCancel = useCallback(() => {
    if (runId) {
      cancelRun({ run_id: runId });
    }

    setIsPending(false);
    abortControllerRef.current?.abort();

    updateLastAssistantMessage((message) => {
      message.status = MessageStatus.Aborted;
    });
  }, [runId, cancelRun, updateLastAssistantMessage]);

  const handleClear = useCallback(() => {
    setMessages([]);
    setRunId(undefined);
    setSessionId(undefined);
    handleCancel();
  }, [handleCancel, setMessages]);

  const contextValue = useMemo(
    () => ({
      agent,
      isPending,
      onCancel: handleCancel,
      onClear: handleClear,
      sendMessage,
    }),
    [agent, isPending, handleCancel, handleClear, sendMessage],
  );

  return (
    <ChatContext.Provider value={contextValue}>
      <ChatMessagesContext.Provider value={messages}>{children}</ChatMessagesContext.Provider>
    </ChatContext.Provider>
  );
}

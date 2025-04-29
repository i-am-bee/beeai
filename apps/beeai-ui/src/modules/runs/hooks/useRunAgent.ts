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

import { useCallback, useRef, useState } from 'react';

import type { Agent } from '#modules/agents/api/types.ts';

import { useCancelRun } from '../api/mutations/useCancelRun';
import { useCreateRunStream } from '../api/mutations/useCreateRunStream';
import {
  type ArtifactEvent,
  EventType,
  type GenericEvent,
  type MessageCompletedEvent,
  type MessagePartEvent,
  type RunCancelledEvent,
  type RunCompletedEvent,
  type RunError,
  type RunFailedEvent,
  type RunId,
  type SessionId,
} from '../api/types';
import type { SendMessageParams } from '../chat/types';
import { createMessagePart, createRunStreamRequest, handleRunStream } from '../utils';

interface Props {
  agent: Agent;
  onRun?: () => void;
  onRunFailed?: (event: RunFailedEvent) => void;
  onRunCancelled?: (event: RunCancelledEvent) => void;
  onRunCompleted?: (event: RunCompletedEvent) => void;
  onMessagePart?: (event: ArtifactEvent | MessagePartEvent) => void;
  onMessageCompleted?: (event: MessageCompletedEvent) => void;
  onGeneric?: (event: GenericEvent) => void;
  onDone?: () => void;
  onStop?: () => void;
  onError?: (error: NonNullable<RunError>) => void;
}

export function useRunAgent({
  agent,
  onRun,
  onRunFailed,
  onRunCancelled,
  onRunCompleted,
  onMessagePart,
  onMessageCompleted,
  onGeneric,
  onDone,
  onStop,
  onError,
}: Props) {
  const abortControllerRef = useRef<AbortController | null>(null);

  const [input, setInput] = useState<string>();
  const [isPending, setIsPending] = useState(false);
  const [runId, setRunId] = useState<RunId>();
  const [sessionId, setSessionId] = useState<SessionId>();

  const { mutateAsync: createRunStream } = useCreateRunStream();
  const { mutate: cancelRun } = useCancelRun();

  const handleDone = useCallback(() => {
    setIsPending(false);

    onDone?.();
  }, [onDone]);

  const runAgent = useCallback(
    async ({ input }: SendMessageParams) => {
      try {
        onRun?.();

        setIsPending(true);
        setInput(input);

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

        handleRunStream({
          stream,
          onEvent: (event) => {
            switch (event.type) {
              case EventType.RunCreated:
                setRunId(event.run.run_id);
                setSessionId(event.run.session_id);

                break;
              case EventType.RunFailed:
                handleDone();
                onRunFailed?.(event);

                break;
              case EventType.RunCancelled:
                handleDone();
                onRunCancelled?.(event);

                break;
              case EventType.RunCompleted:
                handleDone();
                onRunCompleted?.(event);

                break;
              case EventType.MessagePart:
                onMessagePart?.(event);

                break;
              case EventType.MessageCompleted:
                onMessageCompleted?.(event);

                break;
              case EventType.Generic:
                onGeneric?.(event);

                break;
            }
          },
        });
      } catch (error) {
        handleDone();

        const message =
          error instanceof Error ? error.message : typeof error === 'string' ? error : 'Agent run failed.';

        onError?.({
          code: 'server_error',
          message,
        });
      }
    },
    [
      agent.name,
      sessionId,
      createRunStream,
      handleDone,
      onRun,
      onRunFailed,
      onRunCancelled,
      onRunCompleted,
      onMessagePart,
      onMessageCompleted,
      onGeneric,
      onError,
    ],
  );

  const stopAgent = useCallback(() => {
    setIsPending(false);

    if (runId) {
      cancelRun({ run_id: runId });
    }

    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    onStop?.();
  }, [runId, cancelRun, onStop]);

  return {
    input,
    isPending,
    runAgent,
    stopAgent,
  };
}

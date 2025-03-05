/**
 * Copyright 2025 IBM Corp.
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

import { useRunAgent } from '#modules/run/api/mutations/useRunAgent.tsx';
import { TextNotification, TextNotificationSchema, TextResult } from '#modules/run/api/types.ts';
import { RunStats } from '#modules/run/types.ts';
import { Agent } from '@i-am-bee/acp-sdk/types.js';
import type { TextInput, TextOutput } from '@i-am-bee/beeai-sdk/schemas/text';
import { PropsWithChildren, useCallback, useMemo, useRef, useState } from 'react';
import { HandsOffContext } from './hands-off-context';

interface Props {
  agent: Agent;
}

export function HandsOffProvider({ agent, children }: PropsWithChildren<Props>) {
  const [input, setInput] = useState<TextInput>();
  const [output, setOutput] = useState<TextOutput>();
  const [stats, setStats] = useState<RunStats>();
  const [isPending, setIsPending] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { runAgent } = useRunAgent<TextInput, TextNotificationSchema>({
    notifications: {
      handler: (notification) => {
        handleNotification(notification);
      },
    },
    queryMetadata: {
      errorToast: false,
    },
  });

  const handleNotification = useCallback((notification: TextNotification) => {
    console.log(notification.params.delta);
  }, []);

  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const handleReset = useCallback(() => {
    setInput(undefined);
    setOutput(undefined);
    setStats(undefined);
  }, []);

  const handleClear = useCallback(() => {
    handleCancel();
    handleReset();
  }, [handleCancel, handleReset]);

  const run = useCallback(
    async (inputText: string) => {
      try {
        const input = { text: inputText };
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        handleReset();
        setInput(input);
        setStats({ startTime: Date.now() });
        setIsPending(true);

        const response = (await runAgent({
          agent,
          input,
          abortController,
        })) as TextResult;

        setOutput(response.output);
      } catch (error) {
        console.error(error);
      } finally {
        setStats((stats) => ({ ...stats, endTime: Date.now() }));
        setIsPending(false);
      }
    },
    [agent, runAgent, handleReset],
  );

  const contextValue = useMemo(
    () => ({
      agent,
      input,
      output,
      stats,
      isPending,
      onSubmit: run,
      onCancel: handleCancel,
      onReset: handleReset,
      onClear: handleClear,
    }),
    [agent, input, output, stats, isPending, run, handleCancel, handleReset, handleClear],
  );

  return <HandsOffContext.Provider value={contextValue}>{children}</HandsOffContext.Provider>;
}

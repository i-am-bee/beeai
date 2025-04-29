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
import { useCallback, useMemo, useState } from 'react';

import { useToast } from '#contexts/Toast/index.ts';
import type { Agent } from '#modules/agents/api/types.ts';
import type { RunError } from '#modules/runs/api/types.ts';
import { useRunAgent } from '#modules/runs/hooks/useRunAgent.ts';
import type { RunLog, RunStats } from '#modules/runs/types.ts';
import { extractOutput, isArtifact } from '#modules/runs/utils.ts';

import { HandsOffContext } from './hands-off-context';

interface Props {
  agent: Agent;
}

export function HandsOffProvider({ agent, children }: PropsWithChildren<Props>) {
  const [output, setOutput] = useState<string>('');
  const [stats, setStats] = useState<RunStats>();
  const [logs, setLogs] = useState<RunLog[]>([]);

  const { addToast } = useToast();

  const { input, isPending, runAgent, stopAgent } = useRunAgent({
    onRun: () => {
      handleReset();
      setStats({ startTime: Date.now() });
    },
    onMessagePart: (event) => {
      const { part } = event;

      if (isArtifact(part)) {
        return;
      }

      const { content } = part;

      setOutput((output) => (content ? output.concat(content) : output));
    },
    onRunCompleted: (event) => {
      const output = extractOutput(event.run.output);

      setOutput(output);
    },
    onGeneric: (event) => {
      const log = event.generic;

      if (log.message) {
        setLogs((logs) => [...logs, log as RunLog]);
      }
    },
    onDone: () => {
      handleDone();
    },
    onRunFailed: (event) => {
      handleError(event.run.error);
    },
    onError: ({ error }) => {
      handleError(error);
    },
  });

  const handleDone = useCallback(() => {
    setStats((stats) => ({ ...stats, endTime: Date.now() }));
  }, []);

  const handleError = useCallback(
    (error: RunError) => {
      if (error) {
        addToast({
          title: error.code,
          subtitle: error.message,
        });
      }
    },
    [addToast],
  );

  const handleReset = useCallback(() => {
    setOutput('');
    setStats(undefined);
    setLogs([]);
  }, []);

  const handleClear = useCallback(() => {
    if (isPending) {
      stopAgent();
    }
    handleReset();
  }, [isPending, stopAgent, handleReset]);

  const run = useCallback(
    async (input: string) => {
      await runAgent({ agent, content: input });
    },
    [agent, runAgent],
  );

  const contextValue = useMemo(
    () => ({
      agent,
      input,
      output,
      stats,
      logs,
      isPending,
      onSubmit: run,
      onClear: handleClear,
    }),
    [agent, input, output, stats, logs, isPending, run, handleClear],
  );

  return <HandsOffContext.Provider value={contextValue}>{children}</HandsOffContext.Provider>;
}

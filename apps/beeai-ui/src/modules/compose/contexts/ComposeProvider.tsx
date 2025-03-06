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

import { PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgentInstance, ComposeContext } from './compose-context';
import { useSearchParams } from 'react-router';
import { useRunAgent } from '#modules/run/api/mutations/useRunAgent.tsx';
import { useListAgents } from '#modules/agents/api/queries/useListAgents.ts';
import { isNotNull } from '#utils/helpers.ts';
import { getComposeDeltaResultText, getComposeResultText } from '../utils';
import { useHandleError } from '#hooks/useHandleError.ts';
import {
  ComposeInput,
  ComposeNotifications,
  composeNotificationSchema,
  ComposeNotificationsZod,
  ComposeResult,
} from '../types';
import { usePrevious } from '#hooks/usePrevious.ts';
import { getSequentialComposeAgent, SEQUENTIAL_COMPOSE_AGENT_NAME } from '../sequential-workflow';

export function ComposeProvider({ children }: PropsWithChildren) {
  const { data: availableAgents } = useListAgents();
  const [agents, setAgents] = useState<AgentInstance[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState<string>();
  const abortControllerRef = useRef<AbortController | null>(null);
  const handleError = useHandleError();
  const [isPending, setPending] = useState<boolean>(false);

  useEffect(() => {
    if (!availableAgents) return;

    const agentNames = searchParams
      .get(URL_PARAM_AGENTS)
      ?.split(',')
      .filter((item) => item.length);
    if (agentNames?.length) {
      setAgents(
        agentNames
          .map((name) => {
            const agent = availableAgents.find((agent) => name === agent.name);
            return agent ? { data: agent } : null;
          })
          .filter(isNotNull),
      );
    }
  }, [availableAgents, searchParams]);

  const previousAgents = usePrevious(agents);
  useEffect(() => {
    if (!availableAgents || agents.length === previousAgents.length) return;

    setSearchParams((searchParams) => {
      searchParams.set('agents', agents.map(({ data }) => data.name).join(','));
      return searchParams;
    });
  }, [agents, availableAgents, previousAgents, setSearchParams]);

  const handleRunDelta = useCallback((delta: ComposeNotifications['params']['delta']) => {
    if (delta.agent_idx === undefined) return;

    setAgents((agents) =>
      agents.map((agent, idx) => {
        if (idx === delta.agent_idx) {
          if (delta.agent_name !== agent.data.name) {
            console.error(`Agent name and index mismatch: ${delta.agent_name} is supposed to be at index '${idx}'`);
            return agent;
          }

          return {
            ...agent,
            isPending: true,
            stats: {
              startTime: agent.stats?.startTime ?? Date.now(),
            },
            result: `${agent.result ?? ''}${getComposeDeltaResultText(delta)}`,
            logs: [...(agent.logs ?? []), ...delta.logs.filter(isNotNull).map((item) => item.message)],
          };
        } else {
          return {
            ...agent,
            isPending: false,
            stats: agent.stats?.startTime ? { ...agent.stats, endTime: agent.stats.endTime ?? Date.now() } : undefined,
          };
        }
      }),
    );
  }, []);

  const { runAgent } = useRunAgent<ComposeInput, ComposeNotificationsZod>({
    notifications: {
      schema: composeNotificationSchema,
      handler: (notification) => {
        handleRunDelta(notification.params.delta);
      },
    },
    queryMetadata: {
      errorToast: false,
    },
  });

  const send = useCallback(
    async (input: string) => {
      try {
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        setResult('');

        const composeAgent = getSequentialComposeAgent(availableAgents);
        if (!composeAgent) throw Error(`'${SEQUENTIAL_COMPOSE_AGENT_NAME}' agent is not available.`);

        setAgents((agents) =>
          agents.map((instance, index) => ({
            data: instance.data,
            isPending: index === 0,
            logs: [],
            stats:
              index === 0
                ? {
                    startTime: Date.now(),
                  }
                : undefined,
          })),
        );

        setPending(true);

        const result = (await runAgent({
          agent: composeAgent,
          input: { input: { text: input }, agents: agents.map(({ data }) => data.name) },
          abortController,
        })) as ComposeResult;

        setResult(getComposeResultText(result));
      } catch (error) {
        if (abortControllerRef.current?.signal.aborted) return;

        console.error(error);
        handleError(error, { errorToast: { title: 'Agent run failed', includeErrorMessage: true } });
      } finally {
        setPending(false);
        setAgents((agents) =>
          agents.map((instance) => {
            instance.isPending = false;
            if (instance.stats && !instance.stats?.endTime) {
              instance.stats.endTime = Date.now();
            }
            return instance;
          }),
        );
      }
    },
    [agents, availableAgents, handleError, runAgent],
  );

  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const handleReset = useCallback(() => {
    setResult('');
    setAgents((agents) =>
      agents.map(({ data }) => ({
        data,
      })),
    );
  }, []);

  const value = useMemo(
    () => ({
      agents,
      result,
      isPending,
      setAgents,
      onSubmit: send,
      onCancel: handleCancel,
      onClear: () => setAgents([]),
      onReset: handleReset,
    }),
    [agents, handleCancel, handleReset, isPending, result, send],
  );

  return <ComposeContext.Provider value={value}>{children}</ComposeContext.Provider>;
}

const URL_PARAM_AGENTS = 'agents';

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

import { useHandleError } from '#hooks/useHandleError.ts';
import { usePrevious } from '#hooks/usePrevious.ts';
import { useListAgents } from '#modules/agents/api/queries/useListAgents.ts';
import { useRunAgent } from '#modules/run/api/mutations/useRunAgent.tsx';
import { isNotNull } from '#utils/helpers.ts';
import { PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { getSequentialComposeAgent, SEQUENTIAL_COMPOSE_AGENT_NAME } from '../sequential-workflow';
import { ComposeNotificationDelta, ComposeNotificationSchema, ComposeResult, SequentialWorkflowInput } from '../types';
import { getComposeDeltaResultText, getComposeResultText } from '../utils';
import { ComposeStep, ComposeContext, SequentialFormValues } from './compose-context';
import { useFieldArray, useForm } from 'react-hook-form';

export function ComposeProvider({ children }: PropsWithChildren) {
  const { data: availableAgents } = useListAgents();
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState<string>();
  const abortControllerRef = useRef<AbortController | null>(null);
  const handleError = useHandleError();
  const [isPending, setPending] = useState<boolean>(false);

  const { handleSubmit, getValues } = useForm<SequentialFormValues>();
  const {
    update: updateStep,
    replace: replaceSteps,
    fields: steps,
  } = useFieldArray<SequentialFormValues>({
    name: 'steps',
  });

  useEffect(() => {
    if (!availableAgents) return;

    const agentNames = searchParams
      .get(URL_PARAM_AGENTS)
      ?.split(',')
      .filter((item) => item.length);
    if (agentNames?.length) {
      replaceSteps(
        agentNames
          .map((name) => {
            const agent = availableAgents.find((agent) => name === agent.name);
            return agent ? { data: agent, instruction: '' } : null;
          })
          .filter(isNotNull),
      );
    }
  }, [availableAgents, replaceSteps, searchParams]);

  const previousSteps = usePrevious(steps);
  useEffect(() => {
    if (!availableAgents || steps.length === previousSteps.length) return;

    setSearchParams((searchParams) => {
      searchParams.set('agents', steps.map(({ data }) => data.name).join(','));
      return searchParams;
    });
  }, [availableAgents, previousSteps.length, setSearchParams, steps]);

  const handleRunDelta = useCallback(
    (delta: ComposeNotificationDelta) => {
      if (delta.agent_idx === undefined) return;

      console.log(delta);

      const fieldName = `steps.${delta.agent_idx}` as const;
      const step = getValues(fieldName);

      if (!step) return;

      step.isPending = true;
      step.stats = {
        startTime: step.stats?.startTime ?? Date.now(),
      };
      step.result = `${step.result ?? ''}${getComposeDeltaResultText(delta)}`;
      step.logs = [...(step.logs ?? []), ...delta.logs.filter(isNotNull).map((item) => item.message)];

      updateStep(delta.agent_idx, step);

      if (delta.agent_idx > 0) {
        const stepsBefore = getValues('steps').slice(0, delta.agent_idx - 1);
        stepsBefore.forEach((step, stepsBeforeIndex) => {
          if (step.isPending || !step.stats?.endTime) {
            step.isPending = false;
            step.stats = { ...step.stats, endTime: Date.now() };
          }
          updateStep(stepsBeforeIndex, step);
        });
      }
    },
    [getValues, updateStep],
  );

  const { runAgent } = useRunAgent<SequentialWorkflowInput, ComposeNotificationSchema>({
    notifications: {
      handler: (notification) => {
        handleRunDelta(notification.params.delta);
      },
    },
    queryMetadata: {
      errorToast: false,
    },
  });

  const send = useCallback(
    async (steps: ComposeStep[]) => {
      try {
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        setResult('');

        const composeAgent = getSequentialComposeAgent(availableAgents);
        if (!composeAgent) throw Error(`'${SEQUENTIAL_COMPOSE_AGENT_NAME}' agent is not available.`);

        steps.forEach((step, idx) => {
          updateStep(idx, {
            ...step,
            result: undefined,
            isPending: idx === 0,
            logs: [],
            stats:
              idx === 0
                ? {
                    startTime: Date.now(),
                  }
                : undefined,
          });
        });

        const result = (await runAgent({
          agent: composeAgent,
          input: {
            steps: steps.map(({ data, instruction }) => ({ agent: data.name, instruction })),
          },
          abortController,
        })) as ComposeResult;

        setResult(getComposeResultText(result));
      } catch (error) {
        if (abortControllerRef.current?.signal.aborted) return;

        console.error(error);
        handleError(error, { errorToast: { title: 'Agent run failed', includeErrorMessage: true } });
      } finally {
        setPending(false);

        const steps = getValues('steps');
        replaceSteps(
          steps.map((step) => {
            step.isPending = false;
            if (step.stats && !step.stats?.endTime) {
              step.stats.endTime = Date.now();
            }
            return step;
          }),
        );
      }
    },
    [availableAgents, getValues, handleError, replaceSteps, runAgent, updateStep],
  );

  // const onSubmit = useCallback(() => {
  //   console.log({ steps, values: getValues() });

  //   handleSubmit(async ({ steps }) => {
  //     console.log({ valuesStep: steps, values: getValues() });

  //     await send(steps);
  //   })();
  // }, [getValues, handleSubmit, send, steps]);

  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const handleReset = useCallback(() => {
    setResult('');
    const steps = getValues('steps');
    replaceSteps(
      steps.map(({ data }) => ({
        data,
        instruction: '',
      })),
    );
  }, [getValues, replaceSteps]);

  const value = useMemo(
    () => ({
      result,
      isPending,
      onSubmit: handleSubmit(async ({ steps }) => {
        console.log({ valuesStep: steps, values: getValues() });

        await send(steps);
      }),
      onCancel: handleCancel,
      onClear: () => replaceSteps([]),
      onReset: handleReset,
    }),
    [getValues, handleCancel, handleReset, handleSubmit, isPending, replaceSteps, result, send],
  );

  return <ComposeContext.Provider value={value}>{children}</ComposeContext.Provider>;
}

const URL_PARAM_AGENTS = 'agents';

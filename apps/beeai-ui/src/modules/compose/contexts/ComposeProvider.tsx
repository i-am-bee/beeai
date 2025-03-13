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
import { TextResult } from '#modules/run/api/types.ts';
import { isNotNull } from '#utils/helpers.ts';
import { PropsWithChildren, useCallback, useEffect, useMemo, useRef } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { useSearchParams } from 'react-router';
import { SEQUENTIAL_COMPOSE_AGENT_NAME } from '../sequential/constants';
import { SequentialWorkflowInput } from '../sequential/types';
import { getSequentialComposeAgent } from '../sequential/utils';
import { ComposeNotificationDelta, ComposeNotificationSchema } from '../types';
import { ComposeContext, ComposeStep, RunStatus, SequentialFormValues } from './compose-context';

export function ComposeProvider({ children }: PropsWithChildren) {
  const { data: availableAgents } = useListAgents();
  const [searchParams, setSearchParams] = useSearchParams();
  const abortControllerRef = useRef<AbortController | null>(null);
  const handleError = useHandleError();

  const {
    handleSubmit,
    getValues,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useFormContext<SequentialFormValues>();
  const stepsFields = useFieldArray<SequentialFormValues>({
    name: 'steps',
  });

  const { replace: replaceSteps } = stepsFields;
  const steps = watch('steps');

  const updateStep = useCallback(
    (idx: number, value: ComposeStep) => {
      setValue(`steps.${idx}`, value);
    },
    [setValue],
  );

  const previousSteps = usePrevious(steps);
  useEffect(() => {
    if (!availableAgents || steps.length === previousSteps.length) return;

    setSearchParams((searchParams) => {
      searchParams.set('agents', steps.map(({ data }) => data.name).join(','));
      return searchParams;
    });
  }, [availableAgents, previousSteps.length, setSearchParams, steps]);

  useEffect(() => {
    if (!availableAgents) return;

    const agentNames = searchParams
      .get(URL_PARAM_AGENTS)
      ?.split(',')
      .filter((item) => item.length);
    if (agentNames?.length && !steps.length) {
      replaceSteps(
        agentNames
          .map((name) => {
            const agent = availableAgents.find((agent) => name === agent.name);
            return agent ? { data: agent, instruction: '' } : null;
          })
          .filter(isNotNull),
      );
    }
  }, [availableAgents, replaceSteps, searchParams, steps.length]);

  const handleSuccessLog = useCallback(
    (logs: ComposeNotificationDelta['logs']) => {
      const successLog = logs.find((log) => log?.level === 'success');
      if (successLog) {
        const steps = getValues('steps');
        const pendingStepIndex = steps.findIndex((step) => step.isPending);
        const pendingStep = steps.at(pendingStepIndex);
        if (pendingStep) {
          const updatedStep = {
            ...pendingStep,
            isPending: false,
            stats: { ...pendingStep.stats, endTime: Date.now() },
          };
          updateStep(pendingStepIndex, updatedStep);

          const nextStepIndex = pendingStepIndex + 1;
          const nextStep = steps.at(pendingStepIndex + 1);
          if (nextStep) {
            const nextUpdatedStep = {
              ...nextStep,
              isPending: true,
              stats: {
                startTime: nextStep.stats?.startTime ?? Date.now(),
              },
            };
            updateStep(nextStepIndex, nextUpdatedStep);
          }
        }
      }
    },
    [getValues, updateStep],
  );

  const handleRunDelta = useCallback(
    (delta: ComposeNotificationDelta) => {
      if (delta.agent_idx === undefined) {
        handleSuccessLog(delta.logs);
        return;
      }

      const fieldName = `steps.${delta.agent_idx}` as const;
      const step = getValues(fieldName);

      if (!step) return;

      const updatedStep = {
        ...step,
        isPending: true,
        stats: {
          startTime: step.stats?.startTime ?? Date.now(),
        },
        result: `${step.result ?? ''}${delta.text ?? ''}`,
        logs: [...(step.logs ?? []), ...delta.logs.filter(isNotNull).map((item) => item.message)],
      };

      updateStep(delta.agent_idx, updatedStep);

      if (delta.agent_idx > 0) {
        const stepsBefore = getValues('steps').slice(0, delta.agent_idx);

        stepsBefore.forEach((step, stepsBeforeIndex) => {
          if (step.isPending || !step.stats?.endTime) {
            updateStep(stepsBeforeIndex, { ...step, isPending: false, stats: { ...step.stats, endTime: Date.now() } });
          }
        });
      }
    },
    [getValues, handleSuccessLog, updateStep],
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
        })) as TextResult;

        const lastStep = getValues('steps').at(-1);
        updateStep(steps.length - 1, { ...lastStep!, result: result.output.text });
      } catch (error) {
        if (abortControllerRef.current?.signal.aborted) return;

        console.error(error);
        handleError(error, { errorToast: { title: 'Agent run failed', includeErrorMessage: true } });
      } finally {
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

  const onSubmit = useCallback(() => {
    handleSubmit(async ({ steps }) => {
      await send(steps);
    })();
  }, [handleSubmit, send]);

  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const handleReset = useCallback(() => {
    const steps = getValues('steps');
    replaceSteps(
      steps.map(({ data, instruction }) => ({
        data,
        instruction,
      })),
    );
  }, [getValues, replaceSteps]);

  const lastStep = steps.at(-1);
  const result = useMemo(() => lastStep?.result, [lastStep]);

  const value = useMemo(
    () => ({
      result,
      status: (isSubmitting ? 'pending' : result ? 'finished' : 'ready') as RunStatus,
      stepsFields,
      onSubmit,
      onCancel: handleCancel,
      onClear: () => replaceSteps([]),
      onReset: handleReset,
    }),
    [handleCancel, handleReset, isSubmitting, onSubmit, replaceSteps, result, stepsFields],
  );

  return <ComposeContext.Provider value={value}>{children}</ComposeContext.Provider>;
}

const URL_PARAM_AGENTS = 'agents';

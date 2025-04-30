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
import { useCallback, useEffect, useMemo } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { useSearchParams } from 'react-router';

import { useHandleError } from '#hooks/useHandleError.ts';
import { usePrevious } from '#hooks/usePrevious.ts';
import { useListAgents } from '#modules/agents/api/queries/useListAgents.ts';
import { useRunAgent } from '#modules/runs/hooks/useRunAgent.ts';
import { extractOutput, isArtifact } from '#modules/runs/utils.ts';
import { isNotNull } from '#utils/helpers.ts';

import { SEQUENTIAL_COMPOSE_AGENT_NAME } from '../sequential/constants';
import { getSequentialComposeAgent } from '../sequential/utils';
import type { ComposeMessagePart } from '../types';
import type { ComposeStep, RunStatus, SequentialFormValues } from './compose-context';
import { ComposeContext } from './compose-context';

export function ComposeProvider({ children }: PropsWithChildren) {
  const { data: availableAgents } = useListAgents();
  const [searchParams, setSearchParams] = useSearchParams();
  const errorHandler = useHandleError();

  const { handleSubmit, getValues, setValue, watch } = useFormContext<SequentialFormValues>();
  const stepsFields = useFieldArray<SequentialFormValues>({
    name: 'steps',
  });

  const { replace: replaceSteps } = stepsFields;
  const steps = watch('steps');

  let lastAgentIdx = 0;

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

  const { isPending, runAgent, stopAgent, reset } = useRunAgent({
    onMessagePart: (event) => {
      const { part } = event;

      if (isArtifact(part)) {
        return;
      }

      // TODO: we could probably figure out better typing
      const { agent_idx, content } = part as ComposeMessagePart;

      const fieldName = `steps.${agent_idx}` as const;
      const step = getValues(fieldName);

      if (!step) return;

      const updatedStep = {
        ...step,
        isPending: true,
        stats: {
          startTime: step.stats?.startTime ?? Date.now(),
        },
        result: `${step.result ?? ''}${content ?? ''}`,
      };

      updateStep(agent_idx, updatedStep);

      if (agent_idx > 0) {
        const stepsBefore = getValues('steps').slice(0, agent_idx);

        stepsBefore.forEach((step, stepsBeforeIndex) => {
          if (step.isPending || !step.stats?.endTime) {
            updateStep(stepsBeforeIndex, { ...step, isPending: false, stats: { ...step.stats, endTime: Date.now() } });
          }
        });
      }
    },
    onRunCompleted: (event) => {
      const finalAgentIdx = steps.length - 1;
      const output = extractOutput(
        event.run.output.map((message) => {
          return {
            ...message,
            parts: message.parts.filter((part) => (part as ComposeMessagePart).agent_idx === finalAgentIdx),
          };
        }),
      );
      const lastStep = getValues('steps').at(-1);

      updateStep(finalAgentIdx, { ...lastStep!, result: output });
    },
    onGeneric: (event) => {
      const { message, agent_idx } = event.generic;

      if (isNotNull(agent_idx)) {
        if (agent_idx !== lastAgentIdx) {
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

        if (message) {
          const fieldName = `steps.${agent_idx}` as const;
          const step = getValues(fieldName);

          const updatedStep = {
            ...step,
            isPending: true,
            stats: {
              startTime: step.stats?.startTime ?? Date.now(),
            },
            logs: [...(step.logs ?? []), message],
          };

          updateStep(agent_idx, updatedStep);
        }

        lastAgentIdx = agent_idx;
      }
    },
    onDone: () => {
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
    },
    onRunFailed: (error) => {
      handleError(error);
    },
    onError: ({ error, aborted }) => {
      if (aborted) {
        return;
      }

      handleError(error);
    },
  });

  const handleError = useCallback(
    (error: unknown) => {
      errorHandler(error, { errorToast: { title: 'Agent run failed', includeErrorMessage: true } });
    },
    [errorHandler],
  );

  const send = useCallback(
    async (steps: ComposeStep[]) => {
      try {
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

        await runAgent({
          agent: composeAgent,
          content: JSON.stringify({
            steps: steps.map(({ data, instruction }) => ({ agent: data.name, instruction })),
          }),
          content_type: 'application/json',
        });
      } catch (error) {
        handleError(error);
      }
    },
    [availableAgents, runAgent, updateStep, handleError],
  );

  const onSubmit = useCallback(() => {
    handleSubmit(async ({ steps }) => {
      await send(steps);
    })();
  }, [handleSubmit, send]);

  const handleCancel = useCallback(() => {
    const steps = getValues('steps');
    replaceSteps(
      steps.map((step) => ({
        ...step,
        stats: {
          ...step.stats,
          endTime: step.stats?.endTime ?? Date.now(),
        },
        isPending: false,
      })),
    );

    stopAgent();
  }, [stopAgent, getValues, replaceSteps]);

  const handleReset = useCallback(() => {
    reset();
    replaceSteps([]);
  }, [replaceSteps, reset]);

  const lastStep = steps.at(-1);
  const result = useMemo(() => lastStep?.result, [lastStep]);

  const value = useMemo(
    () => ({
      result,
      status: (isPending ? 'pending' : result ? 'finished' : 'ready') as RunStatus,
      stepsFields,
      onSubmit,
      onCancel: handleCancel,
      onReset: handleReset,
    }),
    [result, isPending, stepsFields, onSubmit, handleCancel, handleReset],
  );

  return <ComposeContext.Provider value={value}>{children}</ComposeContext.Provider>;
}

const URL_PARAM_AGENTS = 'agents';

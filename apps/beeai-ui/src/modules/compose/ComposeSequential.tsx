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

import { Loading } from '@carbon/react';
import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router';

import { useListAgents } from '../agents/api/queries/useListAgents';
import { useWorkflow } from '../workflows/api/queries/useWorkflow';
import { ComposeView } from './components/ComposeView';
import type { ComposeStep, SequentialFormValues } from './contexts/compose-context';
import { ComposeProvider } from './contexts/ComposeProvider';

export function ComposeSequential() {
  const formReturn = useForm<SequentialFormValues>({
    mode: 'onChange',
    defaultValues: { steps: [] },
  });

  const { reset } = formReturn;

  const [searchParams] = useSearchParams();
  const workflowId = searchParams.get('workflowId');
  const { data: workflow, isLoading: isLoadingWorkflow } = useWorkflow(workflowId ?? '');

  const { data: availableAgents = [] } = useListAgents();

  useEffect(() => {
    if (workflow && availableAgents.length > 0) {
      // Convert backend model to form values
      const formSteps = workflow.steps
        .map((step) => {
          const agent = availableAgents.find((agent) => agent.name === step.agent_name);
          // Skip steps where we can't find the agent
          if (!agent) return null;

          // Create a valid ComposeStep with the required fields
          const composeStep: ComposeStep = {
            data: agent,
            instruction: step.instruction,
          };

          return composeStep;
        })
        .filter((step): step is ComposeStep => step !== null);

      if (formSteps.length > 0) {
        reset({ steps: formSteps });
      }
    }
  }, [workflow, availableAgents, reset]);

  if (workflowId && isLoadingWorkflow) {
    return <Loading />;
  }

  return (
    <FormProvider {...formReturn}>
      <ComposeProvider>
        <ComposeView />
      </ComposeProvider>
    </FormProvider>
  );
}

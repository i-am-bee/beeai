import { PropsWithChildren } from 'react';
import { AgentsContext, FilterFormValues } from './agents-context';
import { useListAgents } from '../api/queries/useListAgents';
import { FormProvider, useForm } from 'react-hook-form';

export function AgentsProvider({ children }: PropsWithChildren) {
  const agentsQuery = useListAgents();

  const formReturn = useForm<FilterFormValues>({
    defaultValues: {
      frameworks: [],
    },
    mode: 'onChange',
  });

  return (
    <AgentsContext.Provider value={{ agentsQuery }}>
      <FormProvider {...formReturn}>{children}</FormProvider>
    </AgentsContext.Provider>
  );
}

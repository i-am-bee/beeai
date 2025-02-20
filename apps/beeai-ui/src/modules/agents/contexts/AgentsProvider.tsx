import { PropsWithChildren } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useListAgents } from '../api/queries/useListAgents';
import { AgentsContext, AgentsFiltersParams } from './agents-context';

export function AgentsProvider({ children }: PropsWithChildren) {
  const agentsQuery = useListAgents();

  const formReturn = useForm<AgentsFiltersParams>({
    mode: 'onChange',
  });

  return (
    <AgentsContext.Provider value={{ agentsQuery }}>
      <FormProvider {...formReturn}>{children}</FormProvider>
    </AgentsContext.Provider>
  );
}

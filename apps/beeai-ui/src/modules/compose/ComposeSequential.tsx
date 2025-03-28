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

import { FormProvider, useForm } from 'react-hook-form';

import { ComposeView } from './components/ComposeView';
import type { SequentialFormValues } from './contexts/compose-context';
import { ComposeProvider } from './contexts/ComposeProvider';

export function ComposeSequential() {
  const formReturn = useForm<SequentialFormValues>({
    mode: 'onChange',
    defaultValues: { steps: [] },
  });

  return (
    <FormProvider {...formReturn}>
      <ComposeProvider>
        <ComposeView />
      </ComposeProvider>
    </FormProvider>
  );
}

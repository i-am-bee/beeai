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

// TODO: Agent import feature is temporarily removed as it is broken due to API changes
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import {
  Button,
  FormLabel,
  InlineLoading,
  ListItem,
  ModalBody,
  ModalFooter,
  ModalHeader,
  RadioButton,
  RadioButtonGroup,
  TextInput,
  UnorderedList,
} from '@carbon/react';
import pluralize from 'pluralize';
import { useCallback, useEffect, useId, useState } from 'react';
import { useController, useForm } from 'react-hook-form';

import { ErrorMessage } from '#components/ErrorMessage/ErrorMessage.tsx';
import { Modal } from '#components/Modal/Modal.tsx';
import type { ModalProps } from '#contexts/Modal/modal-context.ts';
import { useCreateProvider } from '#modules/providers/api/mutations/useCreateProvider.ts';
import type { CreateProviderBody } from '#modules/providers/api/types.ts';
import { ProviderSourcePrefixes } from '#modules/providers/constants.ts';
import { useMonitorProvider } from '#modules/providers/hooks/useMonitorProviderStatus.ts';
import { ProviderSource } from '#modules/providers/types.ts';

import classes from './ImportAgentsModal.module.scss';

export function ImportAgentsModal({ onRequestClose, ...modalProps }: ModalProps) {
  const id = useId();
  const [createdProviderId, setCreatedProviderId] = useState<string>();
  const { status, agents } = useMonitorProvider({ id: createdProviderId });
  const agentsCount = agents?.length ?? 0;

  const { mutate: createProvider, isPending } = useCreateProvider({
    onSuccess: (provider) => {
      setCreatedProviderId(provider.id);
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { isValid },
    control,
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      source: ProviderSource.Local,
    },
  });

  const { field: sourceField } = useController<FormValues, 'source'>({ name: 'source', control });

  const onSubmit = useCallback(
    ({ location, source }: FormValues) => {
      createProvider({
        body: { location: `${ProviderSourcePrefixes[source]}${location}` },
      });
    },
    [createProvider],
  );

  const locationInputProps = INPUTS_PROPS[sourceField.value];

  useEffect(() => {
    setValue('location', '');
  }, [sourceField.value, setValue]);

  return (
    <Modal {...modalProps}>
      <ModalHeader buttonOnClick={() => onRequestClose()}>
        <h2>Import your agents</h2>

        {status === 'initializing' && (
          <p className={classes.description}>
            This could take a few minutes, you will be notified once your agents have been imported successfully.
          </p>
        )}
      </ModalHeader>

      <ModalBody>
        <form onSubmit={handleSubmit(onSubmit)}>
          {status !== 'initializing' && status !== 'ready' && (
            <div className={classes.stack}>
              <RadioButtonGroup
                name={sourceField.name}
                legendText="Select the source of your agent provider"
                valueSelected={sourceField.value}
                onChange={sourceField.onChange}
              >
                <RadioButton labelText="Local path" value={ProviderSource.Local} />

                <RadioButton labelText="GitHub" value={ProviderSource.GitHub} />
              </RadioButtonGroup>

              <TextInput
                id={`${id}:location`}
                size="lg"
                className={classes.locationInput}
                {...locationInputProps}
                {...register('location', { required: true })}
              />
            </div>
          )}

          {status === 'ready' && agentsCount > 0 && (
            <div className={classes.agents}>
              <FormLabel>
                {agentsCount} {pluralize('agent', agentsCount)} imported
              </FormLabel>

              <UnorderedList>
                {agents?.map((agent) => <ListItem key={agent.name}>{agent.name}</ListItem>)}
              </UnorderedList>
            </div>
          )}

          {status === 'initializing' && <InlineLoading description="Scraping repository&hellip;" />}

          {status === 'error' && (
            <ErrorMessage subtitle="Error during agents import. Check the files in the URL provided." />
          )}
        </form>
      </ModalBody>

      <ModalFooter>
        <Button kind="ghost" onClick={() => onRequestClose()}>
          {status === 'initializing' || status === 'ready' ? 'Close' : 'Cancel'}
        </Button>

        {status !== 'initializing' && status !== 'ready' && (
          <Button onClick={() => handleSubmit(onSubmit)()} disabled={isPending || !isValid}>
            {isPending ? <InlineLoading description="Importing&hellip;" /> : 'Continue'}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}

type FormValues = CreateProviderBody & { source: ProviderSource };

const INPUTS_PROPS = {
  [ProviderSource.Local]: {
    labelText: 'Agent provider path',
  },
  [ProviderSource.GitHub]: {
    labelText: 'GitHub repository URL',
    helperText: 'Make sure to provide a public link',
  },
};

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

import { ErrorMessage } from '#components/ErrorMessage/ErrorMessage.tsx';
import { Modal } from '#components/Modal/Modal.tsx';
import { ModalProps } from '#contexts/Modal/modal-context.ts';
import { useCreateProvider } from '#modules/providers/api/mutations/useCreateProvider.ts';
import { CreateProviderBody } from '#modules/providers/api/types.ts';
import { useCheckProviderStatus } from '#modules/providers/hooks/useCheckProviderStatus.ts';
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
import { useForm } from 'react-hook-form';
import classes from './ImportAgentsModal.module.scss';

export function ImportAgentsModal({ onRequestClose, ...modalProps }: ModalProps) {
  const id = useId();
  const [createdProviderId, setCreatedProviderId] = useState<string>();
  const [providerSource, setProviderSource] = useState(ProviderSource.LocalPath);
  const { status, agents } = useCheckProviderStatus({ id: createdProviderId });
  const agentsCount = agents.length;

  const { mutate: createProvider, isPending } = useCreateProvider({
    onSuccess: (provider) => {
      setCreatedProviderId(provider.id);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { isValid },
  } = useForm<CreateProviderBody>({
    mode: 'onChange',
  });

  const onSubmit = useCallback(
    ({ location }: CreateProviderBody) => {
      const locationPrefix = LOCATION_PREFIXES[providerSource];

      createProvider({
        location: `${locationPrefix}${location}`,
      });
    },
    [createProvider, providerSource],
  );

  const locationInputProps = INPUTS_PROPS[providerSource];

  useEffect(() => {
    reset({ location: '' });
  }, [providerSource, reset]);

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
                name={`${id}:provider-source`}
                legendText="Select the source of your agent provider"
                valueSelected={providerSource}
                onChange={(value) => setProviderSource(value as ProviderSource)}
              >
                <RadioButton labelText="Local path" value={ProviderSource.LocalPath} />

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
                {agentsCount} {pluralize('agent', agentsCount)} found
              </FormLabel>

              <UnorderedList>
                {agents.map((agent) => (
                  <ListItem key={agent.name}>{agent.name}</ListItem>
                ))}
              </UnorderedList>
            </div>
          )}

          {status === 'initializing' && <InlineLoading description="Scraping repository&hellip;" />}

          {status === 'error' && (
            <ErrorMessage subtitle="Error during agents import. Check the files in the URL provided" />
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

enum ProviderSource {
  LocalPath = 'LocalPath',
  GitHub = 'GitHub',
}

const LOCATION_PREFIXES = {
  [ProviderSource.LocalPath]: 'file://',
  [ProviderSource.GitHub]: 'git+',
};

const INPUTS_PROPS = {
  [ProviderSource.LocalPath]: {
    labelText: 'Agent provider path',
  },
  [ProviderSource.GitHub]: {
    labelText: 'GitHub repository URL',
    helperText: 'Make sure to provide a public link',
  },
};

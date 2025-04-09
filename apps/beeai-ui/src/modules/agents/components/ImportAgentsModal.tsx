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

import {
  Button,
  Checkbox,
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
import { useInstallProvider } from '#modules/providers/api/mutations/useInstallProvider.ts';
import { useRegisterManagedProvider } from '#modules/providers/api/mutations/useRegisterManagedProvider.ts';
import type { RegisterManagedProviderBody } from '#modules/providers/api/types.ts';
import { ProviderStatus } from '#modules/providers/api/types.ts';
import { ProviderSourcePrefixes } from '#modules/providers/constants.ts';
import { useMonitorProvider } from '#modules/providers/hooks/useMonitorProviderStatus.ts';
import { ProviderSource } from '#modules/providers/types.ts';

import classes from './ImportAgentsModal.module.scss';

export function ImportAgentsModal({ onRequestClose, ...modalProps }: ModalProps) {
  const {
    watch,
    register,
    handleSubmit,
    setValue,
    formState: { isValid },
    control,
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      source: ProviderSource.GitHub,
      shouldInstall: true,
    },
  });

  const shouldInstall = watch('shouldInstall');
  const { field: sourceField } = useController<FormValues, 'source'>({ name: 'source', control });

  const id = useId();
  const [registeredProviderId, setRegisteredProviderId] = useState<string>();
  const { status, agents } = useMonitorProvider({ id: registeredProviderId, shouldInstall });
  const agentsCount = agents?.length ?? 0;

  const { mutate: installProvider } = useInstallProvider();

  const { mutate: registerManagedProvider, isPending } = useRegisterManagedProvider({
    onSuccess: (provider) => {
      setRegisteredProviderId(provider.id);

      if (shouldInstall) {
        installProvider({ body: { id: provider.id } });
      }
    },
  });

  const onSubmit = useCallback(
    ({ location, source }: FormValues) => {
      registerManagedProvider({
        body: { location: `${ProviderSourcePrefixes[source]}${location}` },
      });
    },
    [registerManagedProvider],
  );

  const locationInputProps = INPUTS_PROPS[sourceField.value];

  const isNotInstalled = status === ProviderStatus.NotInstalled;
  const isInstalling = status === ProviderStatus.Installing;
  const isReady = status === ProviderStatus.Ready;
  const isInstallError = status === ProviderStatus.InstallError;

  useEffect(() => {
    setValue('location', '');
  }, [sourceField.value, setValue]);

  return (
    <Modal {...modalProps}>
      <ModalHeader buttonOnClick={() => onRequestClose()}>
        <h2>Import your agents</h2>

        {isInstalling && (
          <p className={classes.description}>
            This could take a few minutes, you will be notified once your agents have been installed successfully.
          </p>
        )}
      </ModalHeader>

      <ModalBody>
        <form onSubmit={handleSubmit(onSubmit)}>
          {!isNotInstalled && !isInstalling && !isReady && (
            <div className={classes.stack}>
              <RadioButtonGroup
                name={sourceField.name}
                legendText="Select the source of your agent provider"
                valueSelected={sourceField.value}
                onChange={sourceField.onChange}
              >
                <RadioButton labelText="GitHub" value={ProviderSource.GitHub} />

                <RadioButton labelText="Docker image" value={ProviderSource.Docker} />
              </RadioButtonGroup>

              <TextInput
                id={`${id}:location`}
                size="lg"
                className={classes.locationInput}
                {...locationInputProps}
                {...register('location', { required: true })}
              />

              <Checkbox id={`${id}:install`} labelText="Install agents automatically" {...register('shouldInstall')} />
            </div>
          )}

          {(isNotInstalled || isReady) && agentsCount > 0 && (
            <div className={classes.agents}>
              <FormLabel>
                {agentsCount} {pluralize('agent', agentsCount)} {isNotInstalled ? 'imported' : 'installed'}
              </FormLabel>

              <UnorderedList>
                {agents?.map((agent) => <ListItem key={agent.name}>{agent.name}</ListItem>)}
              </UnorderedList>
            </div>
          )}

          {isInstalling && <InlineLoading description="Installing agents&hellip;" />}

          {isInstallError && <ErrorMessage subtitle="Agents failed to install." />}
        </form>
      </ModalBody>

      <ModalFooter>
        <Button kind="ghost" onClick={() => onRequestClose()}>
          {isInstalling || isReady ? 'Close' : 'Cancel'}
        </Button>

        {!isNotInstalled && !isInstalling && !isReady && (
          <Button onClick={() => handleSubmit(onSubmit)()} disabled={isPending || !isValid}>
            {isPending ? <InlineLoading description="Importing&hellip;" /> : 'Continue'}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}

type FormValues = RegisterManagedProviderBody & {
  source: ProviderSource;
  shouldInstall: boolean;
};

const INPUTS_PROPS = {
  [ProviderSource.Docker]: {
    labelText: 'Docker image URL',
    placeholder: 'Type your Docker image URL',
  },
  [ProviderSource.GitHub]: {
    labelText: 'GitHub repository URL',
    placeholder: 'Type your GitHub repository URL',
    helperText: 'Make sure to provide a public link',
  },
};

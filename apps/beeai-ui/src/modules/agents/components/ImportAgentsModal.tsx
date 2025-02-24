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

import { Button, InlineLoading, ModalBody, ModalFooter, ModalHeader, TextInput } from '@carbon/react';
import { ModalProps } from '#contexts/Modal/modal-context.ts';
import { Modal } from '#components/Modal/Modal.tsx';
import classes from './AgentModal.module.scss';
import { useImportProvider } from '../api/mutations/useImportAgents';
import { useForm } from 'react-hook-form';
import { useCallback, useId } from 'react';
import { useToast } from '#contexts/Toast/index.ts';

export function ImportAgentsModal({ onRequestClose, ...modalProps }: ModalProps) {
  const id = useId();
  const { addToast } = useToast();
  const { mutate, isPending } = useImportProvider({
    onSuccess: () => {
      addToast({ title: 'Provider was imported successfuly' });
      onRequestClose();
    },
  });

  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm<FormValues>({
    mode: 'onChange',
  });

  const onSubmit = useCallback(
    ({ url }: FormValues) => {
      mutate({ location: url });
    },
    [mutate],
  );

  return (
    <Modal {...modalProps} size="md">
      <ModalHeader buttonOnClick={() => onRequestClose()}>
        <h2>Import your agents</h2>
      </ModalHeader>
      <ModalBody className={classes.body}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextInput id={id} labelText="URL" {...register('url', { required: true })} />
        </form>
      </ModalBody>
      <ModalFooter>
        <Button onClick={() => handleSubmit(onSubmit)()} disabled={isPending || !isValid}>
          {isPending ? <InlineLoading description="Importing..." /> : 'Import'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

interface FormValues {
  url: string;
}

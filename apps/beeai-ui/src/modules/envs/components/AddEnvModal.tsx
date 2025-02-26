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

import { Modal } from '#components/Modal/Modal.tsx';
import { ModalProps } from '#contexts/Modal/modal-context.ts';
import { Button, InlineLoading, ModalBody, ModalFooter, ModalHeader, TextInput } from '@carbon/react';
import { useCallback, useId } from 'react';
import { useForm } from 'react-hook-form';
import { useCreateEnv } from '../api/mutations/useCreateEnv';
import classes from './AddEnvModal.module.scss';

export function AddEnvModal({ onRequestClose, ...modalProps }: ModalProps) {
  const id = useId();

  const { mutate: createEnv, isPending } = useCreateEnv({
    onSuccess: onRequestClose,
  });

  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm<FormValues>({
    mode: 'onChange',
  });

  const onSubmit = useCallback(
    ({ name, value }: FormValues) => {
      createEnv({ body: { [name]: value } });
    },
    [createEnv],
  );

  return (
    <Modal {...modalProps}>
      <ModalHeader buttonOnClick={() => onRequestClose()}>
        <h2>Add environment variable</h2>
      </ModalHeader>

      <ModalBody>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={classes.stack}>
            <TextInput id={`${id}:name`} labelText="Name" {...register('name', { required: true })} />

            <TextInput id={`${id}:value`} labelText="Value" {...register('value', { required: true })} />
          </div>
        </form>
      </ModalBody>

      <ModalFooter>
        <Button kind="ghost" onClick={() => onRequestClose()}>
          Cancel
        </Button>

        <Button onClick={() => handleSubmit(onSubmit)()} disabled={isPending || !isValid}>
          {isPending ? <InlineLoading description="Saving&hellip;" /> : 'Save'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

type FormValues = {
  name: string;
  value: string;
};

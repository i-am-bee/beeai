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

import { Button, InlineLoading, ModalBody, ModalFooter, ModalHeader, TextInput } from '@carbon/react';
import { useCallback, useId } from 'react';
import { useForm } from 'react-hook-form';

import { Modal } from '#components/Modal/Modal.tsx';
import type { ModalProps } from '#contexts/Modal/modal-context.ts';

import { useUpdateVariable } from '../api/mutations/useUpdateVariable';
import classes from './AddVariableModal.module.scss';

export function AddVariableModal({ onRequestClose, ...modalProps }: ModalProps) {
  const id = useId();

  const { mutate: updateVariable, isPending } = useUpdateVariable({
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
      updateVariable({ body: { [name]: value } });
    },
    [updateVariable],
  );

  return (
    <Modal {...modalProps}>
      <ModalHeader buttonOnClick={() => onRequestClose()}>
        <h2>Add variable</h2>
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

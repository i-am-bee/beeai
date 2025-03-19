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
import type { ModalProps } from '#contexts/Modal/modal-context.ts';
import type { MissingEnvs } from '#modules/providers/api/types.ts';
import { Button, InlineLoading, ModalBody, ModalFooter, ModalHeader, TextInput } from '@carbon/react';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useCreateEnv } from '../api/mutations/useCreateEnv';
import classes from './AddRequiredEnvsModal.module.scss';

interface Props extends ModalProps {
  missingEnvs: NonNullable<MissingEnvs>;
}

export function AddRequiredEnvsModal({ missingEnvs, onRequestClose, ...modalProps }: Props) {
  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm<FormValues>({
    mode: 'onChange',
  });

  const { mutate: createEnv, isPending } = useCreateEnv({
    onSuccess: onRequestClose,
  });

  const onSubmit = useCallback(
    (body: FormValues) => {
      createEnv({ body });
    },
    [createEnv],
  );

  return (
    <Modal {...modalProps}>
      <ModalHeader buttonOnClick={() => onRequestClose()}>
        <h2>Required environment variables</h2>

        <p className={classes.description}>
          This agent requires the use of environment variables for one or more tools. Your API key grants access to your
          data and services—if exposed, it can lead to unauthorized access, data leaks, or unexpected charges.
        </p>
      </ModalHeader>

      <ModalBody>
        <form>
          <div className={classes.stack}>
            {missingEnvs.map((env) => (
              <TextInput
                id={env.name}
                key={env.name}
                labelText={env.name}
                helperText={env.description}
                {...register(env.name, { required: env.required })}
              />
            ))}
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
  [key: string]: string;
};

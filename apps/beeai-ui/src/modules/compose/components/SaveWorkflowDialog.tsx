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

import { Modal, TextInput } from '@carbon/react';
import clsx from 'clsx';
import { useCallback, useId, useState } from 'react';
import { useForm } from 'react-hook-form';

import { TextAreaAutoHeight } from '#components/TextAreaAutoHeight/TextAreaAutoHeight.tsx';

import classes from './SaveWorkflowDialog.module.scss';

interface SaveWorkflowDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, description?: string) => Promise<void>;
}

type FormValues = {
  name: string;
  description: string;
};

export function SaveWorkflowDialog({ open, onClose, onSave }: SaveWorkflowDialogProps) {
  const id = useId();
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm<FormValues>({
    mode: 'onChange',
  });

  const onSubmit = useCallback(
    async ({ name, description }: FormValues) => {
      setIsSaving(true);
      try {
        await onSave(name, description);
        onClose();
      } finally {
        setIsSaving(false);
      }
    },
    [onSave, onClose],
  );

  return (
    <Modal
      open={open}
      modalHeading="Save Workflow"
      secondaryButtonText="Cancel"
      primaryButtonText={isSaving ? 'Saving...' : 'Save'}
      onRequestClose={onClose}
      onRequestSubmit={handleSubmit(onSubmit)}
      primaryButtonDisabled={!isValid || isSaving}
      size="sm"
      className={clsx(classes.root)}
    >
      <div className={classes.formContent}>
        <TextInput
          id={`${id}:workflow-name`}
          labelText="Workflow Name"
          className={classes.nameInput}
          placeholder="Enter a name for your workflow"
          autoComplete="off"
          {...register('name', { required: true })}
        />
        <div className={classes.descriptionWrapper}>
          <label htmlFor={`${id}:workflow-description`} className={classes.descriptionLabel}>
            Description (Optional)
          </label>
          <TextAreaAutoHeight
            id={`${id}:workflow-description`}
            className={classes.description}
            {...register('description')}
            rows={3}
            maxRows={6}
          />
        </div>
      </div>
    </Modal>
  );
}

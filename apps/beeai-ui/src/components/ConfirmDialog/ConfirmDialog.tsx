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

import { ModalProps } from '#contexts/Modal/modal-context.ts';
import { Button, ModalBody, ModalFooter, ModalHeader } from '@carbon/react';
import { TrashCan } from '@carbon/react/icons';
import clsx from 'clsx';
import { ComponentType, ReactNode } from 'react';
import { Modal } from '../Modal/Modal';
import classes from './ConfirmDialog.module.scss';

export interface ConfirmDialogProps {
  title: string;
  body?: ReactNode;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  danger?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: ComponentType;
  onSubmit: () => void;
}

export function ConfirmDialog({
  title,
  body,
  primaryButtonText,
  secondaryButtonText,
  danger,
  icon: Icon,
  onSubmit,
  onRequestClose,
  size = 'sm',
  ...props
}: ConfirmDialogProps & ModalProps) {
  const onSubmitClick = () => {
    onRequestClose();
    onSubmit();
  };
  return (
    <Modal size={size} {...props} className={clsx(classes.root)}>
      <ModalHeader buttonOnClick={() => onRequestClose()}>
        <h3 className={classes.heading}>{title}</h3>
      </ModalHeader>

      <ModalBody>{body}</ModalBody>

      <ModalFooter>
        <Button kind="ghost" onClick={() => onRequestClose()}>
          {secondaryButtonText ?? 'Cancel'}
        </Button>

        <Button
          onClick={onSubmitClick}
          kind={danger ? 'danger' : 'secondary'}
          data-modal-primary-focus
          renderIcon={Icon}
        >
          <span>{primaryButtonText ?? 'Ok'}</span>
          {danger && <TrashCan />}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

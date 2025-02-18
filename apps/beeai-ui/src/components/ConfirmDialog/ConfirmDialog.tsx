import { Button, ModalBody, ModalFooter, ModalHeader } from '@carbon/react';
import { TrashCan } from '@carbon/react/icons';
import clsx from 'clsx';
import { ComponentType, ReactNode } from 'react';
import { Modal } from '../Modal/Modal';
import classes from './ConfirmDialog.module.scss';
import { ModalProps } from '@/contexts/Modal/modal-context';

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
  size = 'sm',
  ...props
}: ConfirmDialogProps & ModalProps) {
  const { onRequestClose } = props;
  const onSubmitClick = () => {
    onRequestClose();
    onSubmit();
  };
  return (
    <Modal size={size} {...props} className={clsx(classes.root)}>
      <ModalHeader>
        <h3 className={classes.heading}>{title}</h3>
      </ModalHeader>

      <ModalBody>{body}</ModalBody>

      <ModalFooter>
        <Button kind="ghost" onClick={() => props.onRequestClose()}>
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

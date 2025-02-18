import { useCallback, useContext } from 'react';
import { ModalContext } from './modal-context';
import { ConfirmDialogProps, ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog';

export function useModal() {
  const openModal = useContext(ModalContext);

  const openConfirmation = useCallback(
    (confirmProps: ConfirmDialogProps) => {
      openModal((props) => <ConfirmDialog {...confirmProps} {...props} />);
    },
    [openModal],
  );

  return { openModal, openConfirmation };
}

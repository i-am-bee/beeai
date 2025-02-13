import { ModalBody, ModalFooter, ModalHeader } from '@carbon/react';
import type { FallbackProps } from 'react-error-boundary';
import { Modal } from '../Modal/Modal';
import { ModalProps } from '@/contexts/Modal/ModalContext';

interface Props extends FallbackProps, ModalProps {}

export function FallbackModal({ error, resetErrorBoundary, ...props }: Props) {
  return (
    <Modal {...props} size="xs">
      <ModalHeader title="Error" />
      <ModalBody>
        <p>{error instanceof Error ? error.message : `${error}`}</p>
      </ModalBody>
      <ModalFooter secondaryButtonText="Close" primaryButtonText="Try again" onRequestSubmit={resetErrorBoundary}>
        {/* Hack to satisfy bug in Carbon - children is required in ModalFooterProps by mistake */}
        {''}
      </ModalFooter>
    </Modal>
  );
}

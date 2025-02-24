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

import { ModalBody, ModalFooter, ModalHeader } from '@carbon/react';
import type { FallbackProps } from 'react-error-boundary';
import { Modal } from '../Modal/Modal';
import { ModalProps } from '#contexts/Modal/modal-context.ts';

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

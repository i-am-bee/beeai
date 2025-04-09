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

import type { PropsWithChildren } from 'react';
import { memo, useCallback, useLayoutEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { v4 as uuid } from 'uuid';

import { FallbackModal } from '#components/fallbacks/ModalFallback.tsx';

import type { ModalState, OpenModalFn } from './modal-context';
import { ModalContext } from './modal-context';

export function ModalProvider({ children }: PropsWithChildren) {
  const [modals, setModals] = useState<Record<string, ModalState>>(Object.create(null));

  const openModal: OpenModalFn = useCallback((renderModal) => {
    const modalId = uuid();

    const closeModal = () => {
      setModals((modals) => ({
        ...modals,
        [modalId]: {
          ...modals[modalId],
          isOpen: false,
        },
      }));
    };
    const removeModal = () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      setModals(({ [modalId]: modalToRemove, ...modals }) => modals);
    };

    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) activeElement.blur();

    setModals((modals) => ({
      ...modals,
      [modalId]: {
        isOpen: true,
        renderModal,
        onRequestClose: closeModal,
        onAfterClose: removeModal,
      },
    }));

    return closeModal;
  }, []);

  useLayoutEffect(() => {
    // removes possible focus from activeElement behind a modal
    // also fixes an issue with Carbon Modal stealing focus from a modal
    // opened above it
    if (Object.values(modals).some((state) => state.isOpen)) {
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLElement) activeElement.blur();
    }
  }, [modals]);

  return (
    <ModalContext.Provider value={openModal}>
      {children}
      <div id="modal-root">
        {Object.entries(modals).map(([key, state]) => (
          <ModalWrapper key={key} {...state} />
        ))}
      </div>
    </ModalContext.Provider>
  );
}

const ModalWrapper = memo(function ModalWrapper({ renderModal, ...props }: ModalState) {
  return (
    <ErrorBoundary
      fallbackRender={(fallbackProps) => {
        return <FallbackModal {...props} {...fallbackProps} />;
      }}
    >
      {renderModal(props)}
    </ErrorBoundary>
  );
});

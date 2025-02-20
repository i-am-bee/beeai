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

import { noop } from '@/utils/helpers';
import { createContext, ReactNode } from 'react';

export interface ModalProps {
  /** True if modal is open */
  isOpen: boolean;
  /** Called when modal requests to be closed, you should update isOpen prop there to false */
  onRequestClose: (force?: boolean) => void;
  /** Called when modal finished closing and unmounted from DOM */
  onAfterClose: () => void;
}

interface ModalRenderFn {
  (props: ModalProps): ReactNode;
}

export type OpenModalFn = (renderModal: ModalRenderFn) => () => void;

export interface ModalState {
  isOpen: boolean;
  renderModal: ModalRenderFn;
  onRequestClose: (force?: boolean) => void;
  onAfterClose: () => void;
}

export const ModalContext = createContext<OpenModalFn>(() => noop);

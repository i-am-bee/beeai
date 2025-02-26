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

import { IconProps } from '@carbon/icons-react/lib/Icon';
import { ComponentType, createContext, ReactNode } from 'react';

export interface Toast {
  /**
   * Provide a description for "close" icon button that can be read by screen readers
   */
  ariaLabel?: string;
  caption?: string;
  children?: ReactNode;
  hideCloseButton?: boolean;
  kind?: 'error' | 'info' | 'info-square' | 'success' | 'warning' | 'warning-alt';
  lowContrast?: boolean;
  role?: 'alert' | 'log' | 'status';
  /** Provide a description for "status" icon that can be read by screen readers */
  statusIconDescription?: string;
  subtitle?: string;
  /** Specify an optional duration the notification should be closed in */
  timeout?: number;
  title?: string;
  apiError?: string;
  icon?: ComponentType<IconProps>;
}

export interface ToastContextValue {
  addToast: (toast: Toast) => void;
}

export const ToastContext = createContext<ToastContextValue>(null as unknown as ToastContextValue);

export interface ToastWithKey extends Toast {
  key: string;
}

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

import { ToastNotification, usePrefix } from '@carbon/react';
import { PropsWithChildren, useCallback, useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import classes from './ToastProvider.module.scss';
import { Toast, ToastContext, ToastWithKey } from './toast-context';

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastWithKey[]>([]);
  const prefix = usePrefix();
  const toastPrefix = `${prefix}--toast-notification`;

  const addToast = useCallback(
    (toast: Toast) => {
      setToasts((existing) => {
        const key = uuid();
        const caption = new Date().toLocaleString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        return [{ caption, ...toast, key }, ...existing];
      });
    },
    [setToasts],
  );

  const contextValue = useMemo(() => ({ addToast }), [addToast]);
  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className={classes.toasts}>
        {toasts.map(({ key, caption, subtitle, apiError, ...toast }) => (
          <ToastNotification
            key={key}
            {...toast}
            onClose={() => {
              setToasts((existing) => existing.filter((toast) => toast.key !== key));
            }}
          >
            <div className={`${toastPrefix}__subtitle`}>
              {subtitle && <div className={classes.subtitle}>{subtitle}</div>}
              {apiError && <div className={classes.apiError}>{apiError}</div>}
            </div>
            <div className={`${toastPrefix}__caption`}>{caption}</div>
          </ToastNotification>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

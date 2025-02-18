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

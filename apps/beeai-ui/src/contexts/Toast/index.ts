import { use } from 'react';
import { ToastContext } from './toast-context';

export function useToast() {
  const context = use(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}

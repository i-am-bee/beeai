import { ActionableNotification, Button, InlineLoading } from '@carbon/react';
import { ReactNode } from 'react';
import classes from './ErrorMessage.module.scss';

interface Props {
  title: string;
  subtitle?: string;
  onRetry?: () => void;
  isRefetching?: boolean;
  children?: ReactNode;
}

export function ErrorMessage({ title, subtitle, onRetry, isRefetching, children }: Props) {
  return (
    <ActionableNotification className={classes.root} title={title} kind="error" lowContrast hideCloseButton>
      <div className={classes.body}>
        {subtitle && <p>{subtitle}</p>}
        {onRetry && (
          <Button size="md" onClick={() => onRetry()} disabled={isRefetching}>
            {!isRefetching ? 'Retry' : <InlineLoading description="Retrying..." />}
          </Button>
        )}
        {children}
      </div>
    </ActionableNotification>
  );
}

import { CopyButton } from '@carbon/react';
import { PropsWithChildren } from 'react';
import classes from './TextWithCopyButton.module.scss';
import clsx from 'clsx';

interface Props {
  text: string;
  isCode?: boolean;
  className?: string;
}

export function TextWithCopyButton({ text, isCode, className, children }: PropsWithChildren<Props>) {
  return (
    <div className={clsx(classes.root, className)}>
      {isCode ? <code className={classes.content}>{children}</code> : <div className={classes.content}>{children}</div>}
      <div className={classes.button}>
        <CopyButton
          aria-label="Copy"
          kind="ghost"
          size="sm"
          onClick={() => {
            navigator.clipboard.writeText(text);
          }}
        />
      </div>
    </div>
  );
}

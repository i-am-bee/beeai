import { CopyButton } from '@carbon/react';
import clsx from 'clsx';
import classes from './CopySnippet.module.scss';

interface Props {
  snippet: string;
  className?: string;
}

export function CopySnippet({ snippet, className }: Props) {
  return (
    <div className={clsx(classes.root, className)}>
      <code className={classes.content}>{snippet}</code>

      <div className={classes.button}>
        <CopyButton
          iconDescription="Copy"
          kind="ghost"
          onClick={() => {
            navigator.clipboard.writeText(snippet);
          }}
        />
      </div>
    </div>
  );
}

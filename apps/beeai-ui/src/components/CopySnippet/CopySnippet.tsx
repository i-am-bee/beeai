import { Checkmark, Copy } from '@carbon/icons-react';
import { IconButton } from '@carbon/react';
import clsx from 'clsx';
import { useState } from 'react';
import classes from './CopySnippet.module.scss';

interface Props {
  snippet: string;
  className?: string;
}

export function CopySnippet({ snippet, className }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopyClick = () => {
    navigator.clipboard.writeText(snippet);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className={clsx(classes.root, className)}>
      <code className={classes.content}>{snippet}</code>

      <div className={classes.button}>
        <IconButton label="Copy" kind="ghost" size="md" onClick={handleCopyClick} disabled={copied}>
          {copied ? <Checkmark /> : <Copy />}
        </IconButton>
      </div>
    </div>
  );
}

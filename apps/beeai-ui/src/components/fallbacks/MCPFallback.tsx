import { InlineLoading } from '@carbon/react';
import { ErrorLayout } from '../layouts/ErrorLayout';
import classes from './MCPFallback.module.scss';

export function MCPFallback() {
  return (
    <ErrorLayout>
      <div className={classes.root}>
        <InlineLoading description="Connecting to MCP..." />
      </div>
    </ErrorLayout>
  );
}

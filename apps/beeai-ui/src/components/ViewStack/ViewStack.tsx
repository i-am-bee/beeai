import { PropsWithChildren } from 'react';
import classes from './ViewStack.module.scss';

export function ViewStack({ children }: PropsWithChildren) {
  return <div className={classes.root}>{children}</div>;
}

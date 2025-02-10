import { PropsWithChildren } from 'react';
import classes from './ViewHeader.module.scss';

interface Props {
  heading: string;
}

export function ViewHeader({ heading, children }: PropsWithChildren<Props>) {
  return (
    <header className={classes.root}>
      <h1 className={classes.heading}>{heading}</h1>

      <div>{children}</div>
    </header>
  );
}

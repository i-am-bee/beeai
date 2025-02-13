import { PropsWithChildren, ReactElement } from 'react';
import classes from './ViewHeader.module.scss';

interface Props {
  heading: string;
  label?: ReactElement;
}

export function ViewHeader({ heading, label, children }: PropsWithChildren<Props>) {
  return (
    <header className={classes.root}>
      {label ? <div className={classes.label}>{label}</div> : null}
      <div className={classes.body}>
        <h1 className={classes.heading}>{heading}</h1>

        <div>{children}</div>
      </div>
    </header>
  );
}

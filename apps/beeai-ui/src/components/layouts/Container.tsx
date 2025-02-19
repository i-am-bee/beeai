import clsx from 'clsx';
import { PropsWithChildren } from 'react';
import classes from './Container.module.scss';

interface Props {
  size?: 'sm' | 'md' | 'xlg';
  className?: string;
}

export function Container({ size = 'md', className, children }: PropsWithChildren<Props>) {
  return <div className={clsx(classes.root, className, { [classes[size]]: size })}>{children}</div>;
}

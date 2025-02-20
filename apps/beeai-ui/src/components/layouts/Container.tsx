import clsx from 'clsx';
import { PropsWithChildren } from 'react';
import classes from './Container.module.scss';

interface Props {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xlg';
  className?: string;
}

export function Container({ size = 'md', className, children }: PropsWithChildren<Props>) {
  return <div className={clsx(classes.root, className, { [classes[size]]: size })}>{children}</div>;
}

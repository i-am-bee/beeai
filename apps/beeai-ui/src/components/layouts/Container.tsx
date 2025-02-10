import clsx from 'clsx';
import { PropsWithChildren } from 'react';
import classes from './Container.module.scss';

interface Props {
  size?: 'md' | 'xlg';
}

export function Container({ size = 'md', children }: PropsWithChildren<Props>) {
  return <div className={clsx(classes.root, { [classes[size]]: size })}>{children}</div>;
}

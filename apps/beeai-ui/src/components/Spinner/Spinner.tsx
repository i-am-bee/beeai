import Lottie from 'lottie-react';
import SpinnerAnimation from './BouncingDotsAnimation.json';
import classes from './Spinner.module.scss';
import clsx from 'clsx';

interface Props {
  size?: 'sm' | 'md';
}

export function Spinner({ size = 'md' }: Props) {
  return (
    <div className={clsx(classes.root, classes[`size-${size}`])}>
      <Lottie className={classes.content} animationData={SpinnerAnimation} loop />
    </div>
  );
}

import { PropsWithChildren } from 'react';
import { Container } from './Container';
import classes from './ErrorLayout.module.scss';

export function ErrorLayout({ children }: PropsWithChildren) {
  return (
    <div className={classes.root}>
      <Container>{children}</Container>
    </div>
  );
}

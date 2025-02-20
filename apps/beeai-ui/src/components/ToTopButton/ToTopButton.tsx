import { ArrowUp } from '@carbon/icons-react';
import { IconButton, IconButtonProps } from '@carbon/react';
import classes from './ToTopButton.module.scss';

interface Props {
  onClick?: IconButtonProps['onClick'];
}

export function ToTopButton({ onClick }: Props) {
  return (
    <div className={classes.root}>
      <IconButton label="To top" kind="tertiary" size="md" onClick={onClick}>
        <ArrowUp />
      </IconButton>
    </div>
  );
}

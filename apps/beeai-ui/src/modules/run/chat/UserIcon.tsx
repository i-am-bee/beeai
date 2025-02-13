import classes from './UserIcon.module.scss';
import { User } from '@carbon/icons-react';

export function UserIcon() {
  return (
    <div className={classes.root}>
      <User />
    </div>
  );
}

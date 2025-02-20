import { routes } from '@/utils/router';
import classes from './MainNav.module.scss';
import { TransitionLink } from '../TransitionLink/TransitionLink';

export function MainNav() {
  return (
    <nav>
      <ul className={classes.list}>
        {NAV_ITEMS.map(({ label, to }, idx) => (
          <li key={idx}>
            <TransitionLink to={to} className={classes.link}>
              {label}
            </TransitionLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const NAV_ITEMS = [
  {
    label: <strong>{__APP_NAME__}</strong>,
    to: routes.home(),
  },
  {
    label: 'Agents',
    to: routes.agents(),
  },
];

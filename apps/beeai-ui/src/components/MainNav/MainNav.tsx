import { routes } from '@/utils/router';
import { NavLink } from 'react-router';
import classes from './MainNav.module.scss';

export function MainNav() {
  return (
    <nav>
      <ul className={classes.list}>
        {NAV_ITEMS.map(({ label, to }, idx) => (
          <li key={idx}>
            <NavLink to={to} className={classes.link}>
              {label}
            </NavLink>
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

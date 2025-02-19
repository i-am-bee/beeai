import LogoBluesky from '@/svgs/LogoBluesky.svg';
import { BLUESKY_LINK, DISCORD_LINK, GITHUB_REPO_LINK, YOUTUBE_LINK } from '@/utils/constants';
import { LogoDiscord, LogoGithub, LogoYoutube } from '@carbon/icons-react';
import classes from './CommunityNav.module.scss';

export function CommunityNav() {
  return (
    <nav>
      <ul className={classes.list}>
        {NAV_ITEMS.map(({ label, href, Icon }) => (
          <li key={label} className={classes.item}>
            <a href={href} target="_blank" aria-label={label} className={classes.link}>
              <Icon />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const NAV_ITEMS = [
  {
    label: 'GitHub',
    href: GITHUB_REPO_LINK,
    Icon: LogoGithub,
  },
  {
    label: 'Discord',
    href: DISCORD_LINK,
    Icon: LogoDiscord,
  },
  {
    label: 'YouTube',
    href: YOUTUBE_LINK,
    Icon: LogoYoutube,
  },
  {
    label: 'Bluesky',
    href: BLUESKY_LINK,
    Icon: LogoBluesky,
  },
];

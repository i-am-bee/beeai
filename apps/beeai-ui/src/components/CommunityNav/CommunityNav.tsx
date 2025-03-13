/**
 * Copyright 2025 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import LogoBluesky from '#svgs/LogoBluesky.svg';
import { BLUESKY_LINK, DISCORD_LINK, YOUTUBE_LINK } from '#utils/constants.ts';
import { LogoDiscord, LogoYoutube } from '@carbon/icons-react';
import classes from './CommunityNav.module.scss';

interface Props {
  className?: string;
}

export function CommunityNav({ className }: Props) {
  return (
    <nav className={className}>
      <ul className={classes.list}>
        {NAV_ITEMS.map(({ label, href, Icon }) => (
          <li key={label} className={classes.item}>
            <a href={href} target="_blank" rel="noreferrer" aria-label={label} className={classes.link}>
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

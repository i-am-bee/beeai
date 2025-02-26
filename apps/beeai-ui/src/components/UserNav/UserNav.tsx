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

import Bee from '#svgs/Bee.svg';
import LogoBluesky from '#svgs/LogoBluesky.svg';
import { BLUESKY_LINK, DISCORD_LINK, DOCUMENTATION_LINK, GITHUB_REPO_LINK, YOUTUBE_LINK } from '#utils/constants.ts';
import { routes } from '#utils/router.ts';
import { Launch, LogoDiscord, LogoGithub, LogoYoutube } from '@carbon/icons-react';
import { OverflowMenu, OverflowMenuItem } from '@carbon/react';

export function UserNav() {
  return (
    <OverflowMenu renderIcon={Bee} size="sm" aria-label="User navigation" flipped>
      {ITEMS.map(({ isExternal, itemText, icon, ...props }, idx) => {
        const Icon = icon ? icon : isExternal ? Launch : null;

        return (
          <OverflowMenuItem
            key={idx}
            {...props}
            itemText={
              Icon ? (
                <>
                  <span className="cds--overflow-menu-options__option-content">{itemText}</span> <Icon />
                </>
              ) : (
                itemText
              )
            }
          />
        );
      })}
    </OverflowMenu>
  );
}

const ITEMS = [
  {
    itemText: 'Settings',
    href: routes.settings(),
  },
  {
    itemText: 'Documentation',
    href: DOCUMENTATION_LINK,
    isExternal: true,
  },
  {
    itemText: 'GitHub',
    href: GITHUB_REPO_LINK,
    icon: LogoGithub,
  },
  {
    itemText: 'Discord',
    href: DISCORD_LINK,
    icon: LogoDiscord,
  },
  {
    itemText: 'YouTube',
    href: YOUTUBE_LINK,
    icon: LogoYoutube,
  },
  {
    itemText: 'Bluesky',
    href: BLUESKY_LINK,
    icon: LogoBluesky,
  },
];

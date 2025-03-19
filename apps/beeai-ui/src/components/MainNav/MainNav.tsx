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

import { Tooltip } from '#components/Tooltip/Tooltip.tsx';
import { useIsNavSectionActive } from '#hooks/useIsNavSectionActive.ts';
import { usePhoenix } from '#modules/phoenix/api/queries/usePhoenix.ts';
import { routes, sections } from '#utils/router.ts';
import { APP_NAME, PHOENIX_SERVER_TARGET } from '#utils/vite-constants.ts';
import { Button } from '@carbon/react';
import clsx from 'clsx';
import { TransitionLink } from '../TransitionLink/TransitionLink';
import classes from './MainNav.module.scss';
import { TracesTooltip } from './TracesTooltip';

export function MainNav() {
  const isSectionActive = useIsNavSectionActive();
  const { isPending, error, data: showPhoenixTab } = usePhoenix();

  return (
    <nav>
      <ul className={classes.list}>
        {getNavItems({
          appName: APP_NAME,
          phoenixServerTarget: PHOENIX_SERVER_TARGET,
          showPhoenixTab: Boolean(!isPending && !error && showPhoenixTab),
        }).map(({ label, to, section, target, rel, isDisabled }, idx) => (
          <li key={idx} className={clsx({ [classes.active]: section && isSectionActive(section) })}>
            {isDisabled ? (
              <Tooltip asChild content={<TracesTooltip />}>
                <Button kind="ghost" disabled className={classes.link}>
                  {label}
                </Button>
              </Tooltip>
            ) : target ? (
              <a href={to} className={classes.link} target={target} rel={rel}>
                {label}
              </a>
            ) : (
              <TransitionLink to={to} className={classes.link}>
                {label}
              </TransitionLink>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

function getNavItems({
  appName,
  phoenixServerTarget,
  showPhoenixTab,
}: {
  appName: string;
  phoenixServerTarget: string;
  showPhoenixTab: boolean;
}) {
  return [
    {
      label: <strong>{appName}</strong>,
      to: routes.home(),
    },
    {
      label: 'Agents',
      to: routes.agents(),
      section: sections.agents,
    },
    {
      label: 'Compose playground',
      to: routes.compose(),
      section: sections.compose,
    },
    {
      label: 'Traces',
      to: `${phoenixServerTarget}/projects`,
      target: '_blank',
      rel: 'noreferrer',
      isDisabled: Boolean(!showPhoenixTab || !phoenixServerTarget),
    },
  ];
}

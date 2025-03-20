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

'use client';

import { Tooltip } from '#components/Tooltip/Tooltip.tsx';
import type { CarbonIconType } from '@carbon/icons-react';
import { Button } from '@carbon/react';
import clsx from 'clsx';
import type { ComponentType, PropsWithChildren, ReactNode } from 'react';
import classes from './MainNav.module.scss';

export function MainNav({ children }: PropsWithChildren) {
  return (
    <nav>
      <ul className={classes.list}>{children}</ul>
    </nav>
  );
}

interface MainNavItem {
  label: ReactNode;
  href: string;
  Icon?: CarbonIconType;
  isExternal?: boolean;
  isActive?: boolean;
  isDisabled?: boolean;
  disabledTooltip?: ReactNode;
}

export function MainNavItem({
  component,
  item: { label, href, Icon, isExternal, isActive, isDisabled, disabledTooltip },
}: {
  component: ComponentType;
  item: MainNavItem;
}) {
  const LinkComponent = isExternal ? 'a' : component;
  const linkProps = isExternal ? { target: '_blank', rel: 'noreferrer' } : null;

  return (
    <li className={clsx({ [classes.active]: isActive })}>
      {isDisabled && disabledTooltip ? (
        <Tooltip asChild content={disabledTooltip}>
          <Button kind="ghost" disabled className={classes.link}>
            {label}

            {Icon && <Icon />}
          </Button>
        </Tooltip>
      ) : (
        <LinkComponent {...linkProps} href={href} className={classes.link}>
          {label}

          {Icon && <Icon />}
        </LinkComponent>
      )}
    </li>
  );
}

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

"use client";

import type { ReactNode } from "react";
import { type CarbonIconType, ArrowUpRight } from "@carbon/icons-react";
import { DOCUMENTATION_LINK } from "@i-am-bee/beeai-ui";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import classes from "./MainNav.module.scss";
import { TransitionLink } from "../TransitionLink/TransitionLink";
import Link from "next/link";

export function MainNav() {
  return (
    <nav>
      <ul className={classes.list}>
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.href} item={item} />
        ))}
      </ul>
    </nav>
  );
}

function NavItem({
  item: { label, href, isExternal, isSection, Icon },
}: {
  item: NavItem;
}) {
  const pathname = usePathname();

  const LinkComponent = !isExternal ? TransitionLink : Link;
  const additionalLinkProps = isExternal
    ? { target: "_blank", rel: "noreferrer" }
    : null;

  return (
    <li
      className={clsx({
        [classes.active]: isSection && pathname?.startsWith(href),
      })}
    >
      <LinkComponent
        href={href}
        className={classes.link}
        {...additionalLinkProps}
      >
        {label}

        {Icon && <Icon />}
      </LinkComponent>
    </li>
  );
}

interface NavItem {
  label: ReactNode;
  href: string;
  isSection?: boolean;
  isExternal?: boolean;
  Icon?: CarbonIconType;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: <strong>BeeAI</strong>,
    href: "/",
  },
  {
    label: "Agents",
    href: "/agents",
    isSection: true,
  },
  {
    label: "Docs",
    href: DOCUMENTATION_LINK,
    Icon: ArrowUpRight,
    isExternal: true,
  },
];

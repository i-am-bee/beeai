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

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import classes from "./MainNav.module.scss";

export function MainNav() {
  const pathname = usePathname();
  return (
    <nav>
      <ul className={classes.list}>
        {NAV_ITEMS.map(({ label, href, isSection }, idx) => (
          <li
            key={idx}
            className={clsx({
              [classes.active]: isSection && pathname.startsWith(href),
            })}
          >
            <Link href={href} className={classes.link}>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const NAV_ITEMS = [
  {
    label: <strong>BeeAI</strong>,
    href: "/",
  },
  {
    label: "Agents",
    href: "/agents",
    isSection: true,
  },
];

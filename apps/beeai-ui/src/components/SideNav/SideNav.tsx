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

import { DOCUMENTATION_LINK } from '@/utils/constants';
import classes from './SideNav.module.scss';

export function SideNav() {
  return (
    <nav>
      <ul className={classes.list}>
        {NAV_ITEMS.map(({ label, href }, idx) => (
          <li key={idx}>
            <a href={href} target="_blank" className={classes.link}>
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const NAV_ITEMS = [
  {
    label: 'Documentation',
    href: DOCUMENTATION_LINK,
  },
];

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

import { TransitionLink } from '@/components/TransitionLink/TransitionLink';
import { ArrowUpRight } from '@carbon/icons-react';
import { DOCUMENTATION_LINK, MainNav } from '@i-am-bee/beeai-ui';
import { usePathname } from 'next/navigation';
import { ComponentType } from 'react';

export function Navigation() {
  const pathname = usePathname();

  return (
    <MainNav
      linkComponent={TransitionLink as ComponentType}
      items={items.map(({ section, ...item }) => ({ ...item, isActive: section && pathname?.startsWith(item.href) }))}
    />
  );
}

const items = [
  {
    label: <strong>BeeAI</strong>,
    href: '/',
  },
  {
    label: 'Agents',
    href: '/agents',
    section: true,
  },
  {
    label: 'Docs',
    href: DOCUMENTATION_LINK,
    Icon: ArrowUpRight,
    isExternal: true,
  },
];

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

import { useViewTransition } from '#hooks/useViewTransition.ts';
import { Slot } from '@radix-ui/react-slot';
import type { HTMLProps } from 'react';

interface Props extends Omit<HTMLProps<HTMLAnchorElement>, 'href'> {
  to?: string;
  asChild?: boolean;
}

export function TransitionLink({ to, onClick, asChild, children, ...props }: Props) {
  const { transitionTo } = useViewTransition();

  const Element = asChild ? Slot : 'a';

  return (
    <Element
      {...props}
      href={to}
      onClick={(e) => {
        if (to) {
          transitionTo(to);
        }
        onClick?.(e);
        e.preventDefault();
      }}
    >
      {children}
    </Element>
  );
}

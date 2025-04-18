/**
 * Copyright 2025 © BeeAI a Series of LF Projects, LLC
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

import { Slot } from '@radix-ui/react-slot';
import type { HTMLProps } from 'react';

import { useViewTransition } from '#hooks/useViewTransition.ts';

interface Props extends Omit<HTMLProps<HTMLAnchorElement>, 'href'> {
  href?: string;
  asChild?: boolean;
}

export function TransitionLink({ href, onClick, asChild, children, ...props }: Props) {
  const { transitionTo } = useViewTransition();

  const Element = asChild ? Slot : 'a';

  return (
    <Element
      {...props}
      href={href}
      onClick={(e) => {
        if (href) {
          transitionTo(href);
        }
        onClick?.(e);
        e.preventDefault();
      }}
    >
      {children}
    </Element>
  );
}

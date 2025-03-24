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

import { motion as carbonMotion, moderate02 } from '@carbon/motion';
import type { Variant } from 'framer-motion';

export function parseCarbonMotion(string: string): number[] {
  const matches = string.match(/-?\d*\.?\d+/g);

  return matches ? matches.map(Number) : [];
}

export function fadeProps({
  hidden,
  visible,
}: {
  hidden?: Variant;
  visible?: Variant;
} = {}) {
  return {
    variants: {
      hidden: {
        opacity: 0,
        transition: {
          duration: 0,
          ease: parseCarbonMotion(carbonMotion('exit', 'expressive')),
        },
        ...hidden,
      },
      visible: {
        opacity: 1,
        transition: {
          duration: parseFloat(moderate02) / 1000,
          ease: parseCarbonMotion(carbonMotion('entrance', 'expressive')),
        },
        ...visible,
      },
    },
    initial: 'hidden',
    animate: 'visible',
    exit: 'hidden',
  };
}

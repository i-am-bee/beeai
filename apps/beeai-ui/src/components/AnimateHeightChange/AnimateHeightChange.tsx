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

import { moderate02, motion as carbonMotion } from '@carbon/motion';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import type { PropsWithChildren } from 'react';
import { useEffect, useRef, useState } from 'react';

import { parseCarbonMotion } from '#utils/fadeProps.ts';

import classes from './AnimateHeightChange.module.scss';

interface Props {
  duration?: number;
  className?: string;
}

export function AnimateHeightChange({
  duration = parseFloat(moderate02) / 1000,
  className,
  children,
}: PropsWithChildren<Props>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | 'auto'>('auto');

  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        const observedHeight = entries[0].contentRect.height;

        setHeight(observedHeight);
      });

      resizeObserver.observe(containerRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []);

  return (
    <motion.div
      className={clsx(classes.root, className)}
      style={{ height }}
      initial={{ height }}
      animate={{ height }}
      transition={{
        duration,
        ease: parseCarbonMotion(carbonMotion('entrance', 'expressive')),
      }}
    >
      <div ref={containerRef}>{children}</div>
    </motion.div>
  );
}

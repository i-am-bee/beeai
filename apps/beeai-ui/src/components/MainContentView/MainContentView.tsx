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

import { useToTopButton } from '#hooks/useToTopButton.ts';
import clsx from 'clsx';
import type { PropsWithChildren } from 'react';
import { ToTopButton } from '../ToTopButton/ToTopButton';
import classes from './MainContentView.module.scss';

export interface MainContentViewProps extends PropsWithChildren {
  spacing?: 'md' | 'lg' | false;
  enableToTopButton?: boolean;
  className?: string;
}

export function MainContentView({ spacing = 'lg', enableToTopButton, className, children }: MainContentViewProps) {
  const { ref, showButton, handleToTopClick } = useToTopButton({ enabled: enableToTopButton });

  return (
    <div ref={ref} className={clsx(classes.root, spacing && classes[spacing], className)}>
      {children}

      {showButton && <ToTopButton onClick={handleToTopClick} />}
    </div>
  );
}

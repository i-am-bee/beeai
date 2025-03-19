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

import { ChevronDown } from '@carbon/icons-react';
import { Button, ButtonBaseProps } from '@carbon/react';
import classes from './ExpandButton.module.scss';

export function ExpandButton({ children, ...props }: Omit<ButtonBaseProps, 'ghost' | 'className'>) {
  return (
    <Button {...props} kind="ghost" className={classes.root}>
      <span>{children}</span>

      <ChevronDown />
    </Button>
  );
}

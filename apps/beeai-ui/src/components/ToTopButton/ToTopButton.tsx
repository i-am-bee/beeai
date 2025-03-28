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

import { ArrowUp } from '@carbon/icons-react';
import type { IconButtonProps } from '@carbon/react';
import { IconButton } from '@carbon/react';

import classes from './ToTopButton.module.scss';

interface Props {
  onClick?: IconButtonProps['onClick'];
}

export function ToTopButton({ onClick }: Props) {
  return (
    <div className={classes.root}>
      <IconButton label="To top" kind="tertiary" size="md" onClick={onClick}>
        <ArrowUp />
      </IconButton>
    </div>
  );
}

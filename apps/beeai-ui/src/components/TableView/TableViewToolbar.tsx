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

import { Search } from '@carbon/icons-react';
import type { TextInputProps } from '@carbon/react';
import { TextInput } from '@carbon/react';
import type { ReactNode } from 'react';
import { useId } from 'react';

import classes from './TableViewToolbar.module.scss';

interface Props {
  searchProps: Partial<Omit<TextInputProps, 'id' | 'size' | 'hideLabel'>>;
  button: ReactNode;
}

export function TableViewToolbar({ searchProps, button }: Props) {
  const id = useId();

  return (
    <div className={classes.root}>
      <div className={classes.search}>
        <Search />

        <TextInput labelText="Search" {...searchProps} id={`${id}:search`} size="lg" hideLabel />
      </div>

      <div className={classes.button}>{button}</div>
    </div>
  );
}

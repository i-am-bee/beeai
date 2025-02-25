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

import { isNotNull } from '#utils/helpers.ts';
import { Search } from '@carbon/icons-react';
import { OperationalTag, TextInput } from '@carbon/react';
import clsx from 'clsx';
import { useId, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { AgentsFiltersParams } from '../types';
import classes from './AgentsFilters.module.scss';
import { Agent } from '../api/types';

interface Props {
  agents: Agent[] | undefined;
}

export function AgentsFilters({ agents }: Props) {
  const id = useId();
  const { watch, setValue } = useFormContext<AgentsFiltersParams>();

  const frameworks = useMemo(() => {
    if (!agents) return [];

    return [...new Set(agents.map(({ framework }) => framework))].filter(isNotNull);
  }, [agents]);

  const selectFramework = (framework: string | null) => {
    setValue('framework', framework);
  };

  const selectedFramework = watch('framework');

  return (
    <div className={classes.root}>
      <div className={classes.searchBar}>
        <Search />

        <TextInput
          id={`${id}:search`}
          labelText="Search"
          placeholder="Search the agent catalog"
          onChange={(event) => setValue('search', event.target.value)}
          hideLabel
        />
      </div>

      <div className={classes.frameworks}>
        <OperationalTag
          onClick={() => selectFramework(null)}
          text="All"
          className={clsx(classes.frameworkAll, { selected: !isNotNull(selectedFramework) })}
        />

        {frameworks?.map((framework) => (
          <OperationalTag
            key={framework}
            onClick={() => selectFramework(framework)}
            text={framework}
            className={clsx({ selected: selectedFramework === framework })}
          />
        ))}
      </div>
    </div>
  );
}

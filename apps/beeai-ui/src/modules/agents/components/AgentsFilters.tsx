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

'use client';

import { Search } from '@carbon/icons-react';
import { OperationalTag, TextInput, TextInputSkeleton } from '@carbon/react';
import clsx from 'clsx';
import isEmpty from 'lodash/isEmpty';
import xor from 'lodash/xor';
import { useId, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import { FiltersPopover, type Group } from '#components/FiltersPopover/FiltersPopover.tsx';
import { TagsList } from '#components/TagsList/TagsList.tsx';
import { type AgentsCountedOccurrence, countOccurrences } from '#utils/agents/countOccurrences.ts';

import type { Agent } from '../api/types';
import type { AgentsFiltersParams } from '../providers/AgentsFiltersProvider';
import classes from './AgentsFilters.module.scss';

interface Props {
  agents: Agent[] | undefined;
}

export function AgentsFilters({ agents }: Props) {
  const id = useId();
  const occurrences = useMemo(() => agents && countOccurrences(agents), [agents]);
  const { watch, setValue } = useFormContext<AgentsFiltersParams>();
  const [selectedFrameworks, selectedLanguages, selectedLicenses] = watch(['frameworks', 'languages', 'licenses']);
  const areArrayFiltersActive = Boolean(
    selectedFrameworks.length || selectedLanguages.length || selectedLicenses.length,
  );

  return (
    <div className={clsx(classes.root, { [classes.arrayFiltersActive]: areArrayFiltersActive })}>
      <div className={classes.searchBar}>
        <Search className={classes.searchIcon} />

        <TextInput
          id={`${id}:search`}
          labelText="Search"
          placeholder="Search the agent catalog"
          onChange={(event) => setValue('search', event.target.value)}
          hideLabel
        />

        {occurrences && (
          <div className={classes.popoverContainer}>
            <FiltersPopover
              groups={[
                createGroup({
                  label: 'Framework',
                  occurrence: occurrences.frameworks,
                  selected: selectedFrameworks,
                  onChange: (value) => setValue('frameworks', value),
                }),
                createGroup({
                  label: 'Language',
                  occurrence: occurrences.languages,
                  selected: selectedLanguages,
                  onChange: (value) => setValue('languages', value),
                }),
                createGroup({
                  label: 'License',
                  occurrence: occurrences.licenses,
                  selected: selectedLicenses,
                  onChange: (value) => setValue('licenses', value),
                }),
              ]}
              onClearAll={() => {
                setValue('frameworks', []);
                setValue('languages', []);
                setValue('licenses', []);
              }}
              toggleButtonClassName={classes.toggleButton}
            />
          </div>
        )}
      </div>

      {occurrences?.frameworks && (
        <TagsList
          tags={[
            <OperationalTag
              key="all"
              type="cool-gray"
              text="All"
              className={clsx(classes.frameworksAll, { selected: isEmpty(selectedFrameworks) })}
              onClick={() => setValue('frameworks', [])}
            />,
            ...occurrences.frameworks.map(({ label: framework }) => (
              <OperationalTag
                key={framework}
                type="cool-gray"
                text={framework}
                className={clsx({ selected: selectedFrameworks.includes(framework) })}
                onClick={() => setValue('frameworks', xor(selectedFrameworks, [framework]))}
              />
            )),
          ]}
        />
      )}
    </div>
  );
}

AgentsFilters.Skeleton = function AgentsFiltersSkeleton() {
  return (
    <div className={classes.root}>
      <div className={classes.searchBar}>
        <TextInputSkeleton hideLabel />
      </div>

      <TagsList.Skeleton length={3} />
    </div>
  );
};

interface CreateGroupProps {
  label: string;
  occurrence: AgentsCountedOccurrence;
  selected: string[];
  onChange: (value: string[]) => void;
}

function createGroup({ label, occurrence, selected, onChange }: CreateGroupProps): Group {
  return {
    label,
    options: occurrence.map((item) => ({
      ...item,
      checked: selected.includes(item.label),
      onChange: () => onChange(xor(selected, [item.label])),
    })),
  };
}

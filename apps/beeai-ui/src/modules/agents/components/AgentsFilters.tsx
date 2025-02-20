import { isNotNull } from '@/utils/helpers';
import { Search } from '@carbon/icons-react';
import { OperationalTag, TextInput } from '@carbon/react';
import clsx from 'clsx';
import { useId, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useAgents } from '../contexts';
import { AgentsFiltersParams } from '../contexts/agents-context';
import classes from './AgentsFilters.module.scss';

export function AgentsFilters() {
  const id = useId();
  const {
    agentsQuery: { data },
  } = useAgents();
  const { watch, setValue } = useFormContext<AgentsFiltersParams>();

  const frameworks = useMemo(() => {
    if (!data) return [];

    return [...new Set(data.map(({ framework }) => framework))].filter(isNotNull);
  }, [data]);

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

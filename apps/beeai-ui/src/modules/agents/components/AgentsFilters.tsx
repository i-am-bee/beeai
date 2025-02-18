import classes from './AgentsFilters.module.scss';
import { DismissibleTag, OperationalTag, Tag, TextInput } from '@carbon/react';
import { useId, useMemo } from 'react';
import { Search } from '@carbon/icons-react';
import { useAgents } from '../contexts';
import { useFormContext } from 'react-hook-form';
import { FilterFormValues } from '../contexts/agents-context';
import clsx from 'clsx';
import { isNotNull } from '@/utils/helpers';

export function AgentsFilters() {
  const id = useId();
  const {
    agentsQuery: { data },
  } = useAgents();
  const { watch, setValue, getValues } = useFormContext<FilterFormValues>();

  const frameworks = useMemo(() => {
    if (!data) return [];

    return [...new Set(data.map(({ framework }) => framework))].filter(isNotNull);
  }, [data]);

  const handleToggleFramework = (framework: string) => {
    const value = getValues('frameworks');
    setValue(
      'frameworks',
      value.includes(framework) ? value.filter((item) => item !== framework) : [...value, framework],
    );
  };

  const selectedFrameworks = watch('frameworks');

  return (
    <div className={classes.root}>
      <div className={classes.searchBar}>
        <Search />
        {selectedFrameworks.length ? (
          <div className={classes.activeFilters}>
            <DismissibleTag
              type="high-contrast"
              text={String(selectedFrameworks.length)}
              onClose={() => setValue('frameworks', [])}
            />
          </div>
        ) : null}
        <TextInput
          id={`${id}:search`}
          labelText={undefined}
          placeholder="What are you looking for"
          onChange={(event) => setValue('search', event.target.value)}
        />
      </div>

      <div className={classes.authors}>
        <OperationalTag
          type="cool-gray"
          text="All"
          className={classes.authorAll}
          onClick={() => setValue('frameworks', [])}
        />

        {frameworks?.map((author) => (
          <Tag
            key={author}
            type="outline"
            className={clsx({ [classes.selected]: selectedFrameworks.includes(author) })}
            onClick={() => handleToggleFramework(author)}
          >
            {author}
          </Tag>
        ))}
      </div>
    </div>
  );
}

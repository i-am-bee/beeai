import classes from './AgentsFilters.module.scss';
import { DismissibleTag, OperationalTag, Tag, TextInput } from '@carbon/react';
import { useId, useMemo } from 'react';
import { Search } from '@carbon/icons-react';
import { useAgents } from '../contexts';
import { useFormContext } from 'react-hook-form';
import { FilterFormValues } from '../contexts/AgentsContext';
import clsx from 'clsx';

export function AgentsFilters() {
  const id = useId();
  const {
    agentsQuery: { data },
  } = useAgents();
  const { watch, setValue, getValues } = useFormContext<FilterFormValues>();

  const authors = useMemo(() => {
    if (!data) return [];

    const authors = new Set<string>();
    data.forEach(({ metadata }) => metadata?.author && authors.add(metadata.author));
    return Array.from(authors);
  }, [data]);

  const handleToggleAuthor = (author: string) => {
    const value = getValues('authors');
    setValue('authors', value.includes(author) ? value.filter((item) => item !== author) : [...value, author]);
  };

  const selectedAuthors = watch('authors');

  return (
    <div className={classes.root}>
      <div className={classes.searchBar}>
        <Search />
        {selectedAuthors.length ? (
          <div className={classes.activeFilters}>
            <DismissibleTag
              type="high-contrast"
              text={String(selectedAuthors.length)}
              onClose={() => setValue('authors', [])}
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
          onClick={() => setValue('authors', [])}
        />

        {authors?.map((author) => (
          <Tag
            key={author}
            type="outline"
            className={clsx({ [classes.selected]: selectedAuthors.includes(author) })}
            onClick={() => handleToggleAuthor(author)}
          >
            {author}
          </Tag>
        ))}
      </div>
    </div>
  );
}

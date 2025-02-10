import classes from './AgentsFilters.module.scss';
import { IconButton, TextInput } from '@carbon/react';
import { useId } from 'react';
import { Filter, Search } from '@carbon/icons-react';

export function AgentsFilters() {
  const id = useId();

  return (
    <div className={classes.root}>
      <div className={classes.searchBar}>
        <Search />
        <div className={classes.activeFilters}></div>
        <TextInput id={`${id}:search`} labelText={undefined} />
      </div>
      <IconButton label="Filter" kind="tertiary" size="md" className={classes.filterBtn}>
        <Filter />
      </IconButton>

      {/* <SearchBar search={''} onSearchChange={() => {}} /> */}
    </div>
  );
}

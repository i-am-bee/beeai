import { Search } from '@carbon/react';
import { useId } from 'react';
import classes from './SearchBar.module.scss';

interface Props {
  search: string;
  onSearchChange: (search: string) => void;
}

export function SearchBar({ search, onSearchChange }: Props) {
  const id = useId();

  return (
    <div className={classes.root}>
      <Search
        id={id}
        labelText="Search"
        placeholder="Search all models"
        size="lg"
        value={search}
        onChange={(event) => {
          onSearchChange(event.target.value);
        }}
      />
    </div>
  );
}

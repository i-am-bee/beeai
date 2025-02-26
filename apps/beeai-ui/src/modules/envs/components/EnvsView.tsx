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

import { useModal } from '#contexts/Modal/index.tsx';
import { Search, TrashCan } from '@carbon/icons-react';
import {
  Button,
  DataTable,
  DataTableSkeleton,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TextInput,
} from '@carbon/react';
import { ChangeEvent, useCallback, useId, useMemo, useState } from 'react';
import { useDeleteEnv } from '../api/mutations/useDeleteEnv';
import { useListEnvs } from '../api/queries/useListEnvs';
import { AddEnvModal } from './AddEnvModal';
import classes from './EnvsView.module.scss';

export function EnvsView() {
  const id = useId();
  const { openModal, openConfirmation } = useModal();
  const [search, setSearch] = useState('');
  const { data, isPending } = useListEnvs();
  const { mutate: deleteEnv } = useDeleteEnv();

  const handleSearch = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  }, []);

  const rows = useMemo(() => {
    const entries = (data && Object.entries(data.env)) ?? [];
    const searchQuery = search.trim().toLowerCase();

    return entries
      ?.filter(([name]) => name.toLowerCase().includes(searchQuery))
      .map(([name, value]) => ({
        id: name,
        name,
        value,
        actions: (
          <div className={classes.tableActions}>
            <IconButton
              label="Delete"
              kind="ghost"
              size="sm"
              onClick={() =>
                openConfirmation({
                  title: `Delete '${name}'?`,
                  body: 'Are you sure you want to delete this environment variable? It can’t be undone.',
                  primaryButtonText: 'Delete',
                  danger: true,
                  onSubmit: () => deleteEnv({ name }),
                })
              }
              align="left"
            >
              <TrashCan />
            </IconButton>
          </div>
        ),
      }));
  }, [data, search, deleteEnv, openConfirmation]);

  return (
    <div className={classes.root}>
      <h2 className={classes.heading}>Environment variables</h2>

      <p className={classes.description}>
        Your environment variables are sensitive information and should not be shared with anyone. Keep it secure to
        prevent unauthorized access to your account.
      </p>

      <div className={classes.table}>
        <DataTable headers={HEADERS} rows={rows}>
          {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
            <>
              <div className={classes.toolbar}>
                <div className={classes.toolbarSearch}>
                  <Search />

                  <TextInput
                    id={`${id}:search`}
                    labelText="Search"
                    onChange={handleSearch}
                    disabled={isPending}
                    size="lg"
                    hideLabel
                  />
                </div>

                <Button
                  className={classes.toolbarButton}
                  onClick={() => openModal((props) => <AddEnvModal {...props} />)}
                >
                  Add env variable
                </Button>
              </div>

              {isPending ? (
                <DataTableSkeleton headers={HEADERS} showToolbar={false} />
              ) : (
                <Table {...getTableProps()}>
                  <TableHead>
                    <TableRow>
                      {headers.map((header) => (
                        <TableHeader {...getHeaderProps({ header })} key={header.key}>
                          {header.header}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {rows.length > 0 ? (
                      rows.map((row) => (
                        <TableRow {...getRowProps({ row })} key={row.id}>
                          {row.cells.map((cell) => (
                            <TableCell key={cell.id}>{cell.value}</TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={HEADERS.length}>No results found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </DataTable>
      </div>
    </div>
  );
}

const HEADERS = [
  { key: 'name', header: 'Name' },
  { key: 'value', header: 'Value' },
  { key: 'actions', header: '' },
];

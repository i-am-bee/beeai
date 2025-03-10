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

import { TableView } from '#components/TableView/TableView.tsx';
import { TableViewActions } from '#components/TableView/TableViewActions.tsx';
import { TableViewToolbar } from '#components/TableView/TableViewToolbar.tsx';
import { useModal } from '#contexts/Modal/index.tsx';
import { useTableSearch } from '#hooks/useTableSearch.ts';
import { TrashCan } from '@carbon/icons-react';
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
} from '@carbon/react';
import { useMemo } from 'react';
import { useDeleteEnv } from '../api/mutations/useDeleteEnv';
import { useListEnvs } from '../api/queries/useListEnvs';
import { AddEnvModal } from './AddEnvModal';

export function EnvsView() {
  const { openModal, openConfirmation } = useModal();
  const { data, isPending } = useListEnvs();
  const { mutate: deleteEnv } = useDeleteEnv();
  const entries = useMemo(
    () => (data ? Object.entries(data.env).map(([name, value]) => ({ name, value })) : []),
    [data],
  );
  const { items, onSearch } = useTableSearch({ entries, fields: ['name'] });

  const rows = useMemo(() => {
    return items.map(({ name, value }) => ({
      id: name,
      name,
      value,
      actions: (
        <TableViewActions>
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
        </TableViewActions>
      ),
    }));
  }, [items, deleteEnv, openConfirmation]);

  return (
    <TableView
      description="Your environment variables are sensitive information and should not be shared with anyone. Keep it secure to
        prevent unauthorized access to your account."
    >
      <DataTable headers={HEADERS} rows={rows}>
        {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
          <>
            <TableViewToolbar
              searchProps={{
                onChange: onSearch,
                disabled: isPending,
              }}
              button={
                <Button onClick={() => openModal((props) => <AddEnvModal {...props} />)}>Add env variable</Button>
              }
            />

            {isPending ? (
              <DataTableSkeleton headers={HEADERS} showToolbar={false} showHeader={false} />
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
    </TableView>
  );
}

const HEADERS = [
  { key: 'name', header: 'Name' },
  { key: 'value', header: 'Value' },
  { key: 'actions', header: '' },
];

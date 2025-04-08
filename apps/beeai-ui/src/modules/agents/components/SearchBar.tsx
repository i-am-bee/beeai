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

import { Search } from '@carbon/react';
import { useId } from 'react';

interface Props {
  search: string;
  onSearchChange: (search: string) => void;
}

export function SearchBar({ search, onSearchChange }: Props) {
  const id = useId();

  return (
    <div>
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

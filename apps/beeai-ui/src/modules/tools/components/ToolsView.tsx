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

import { useListTools } from '../api/queries/useListTools';

export const ToolsView = () => {
  const { data, isLoading, isSuccess } = useListTools();

  if (isLoading || !data || !isSuccess) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <h2>Available Tools</h2>
      <ul>
        {data.tools.map((tool) => (
          <li key={tool.name}>
            {tool.name} - {tool.description}
          </li>
        ))}
      </ul>
    </>
  );
};

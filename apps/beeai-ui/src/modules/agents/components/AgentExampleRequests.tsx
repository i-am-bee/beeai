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

import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@carbon/react';
import { CopySnippet } from '#components/CopySnippet/CopySnippet.tsx';

interface Props {
  cli: string;
}

export function AgentExampleRequests({ cli }: Props) {
  return (
    <Tabs>
      <TabList>
        <Tab>CLI</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <CopySnippet type="multi" snippet={cli} />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}

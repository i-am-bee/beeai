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

import { ErrorMessage } from '#components/ErrorMessage/ErrorMessage.tsx';
import { SkeletonItems } from '#components/SkeletonItems/SkeletonItems.tsx';
import { useListTools } from '#modules/tools/api/queries/useListTools.ts';
import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { ChatFormValues } from './ChatInput';
import classes from './ChatTools.module.scss';
import { ToolToggle } from './ToolToggle';
import { ChatSupportedTools } from './constants';

export function ChatTools() {
  const { setValue, watch } = useFormContext<ChatFormValues>();
  const { data, isPending, error, isRefetching, refetch } = useListTools();
  const tools = data?.tools.filter(({ name }) => ChatSupportedTools.includes(name));
  const chatTools = watch('tools');

  const handleToggle = useCallback(
    ({ tool, checked }: { tool: string; checked: boolean }) => {
      if (checked) {
        setValue('tools', chatTools ? [...chatTools, tool] : [tool]);
      } else {
        setValue('tools', chatTools ? chatTools.filter((item) => item !== tool) : []);
      }
    },
    [chatTools, setValue],
  );

  if (error && !tools) {
    return (
      <ErrorMessage
        title="Failed to load tools."
        onRetry={refetch}
        isRefetching={isRefetching}
        subtitle={error?.message}
      />
    );
  }

  return (
    <div className={classes.root}>
      <h2 className={classes.heading}>Tools</h2>

      <ul className={classes.list}>
        {!isPending ? (
          tools?.map((tool) => (
            <li key={tool.name}>
              <ToolToggle
                tool={tool}
                toggled={Boolean(chatTools?.includes(tool.name))}
                onToggle={(checked) => handleToggle({ tool: tool.name, checked })}
              />
            </li>
          ))
        ) : (
          <SkeletonItems
            count={3}
            render={(idx) => (
              <li key={idx}>
                <ToolToggle.Skeleton />
              </li>
            )}
          />
        )}
      </ul>
    </div>
  );
}

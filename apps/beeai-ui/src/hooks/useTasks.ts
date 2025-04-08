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

const tasks = new Map<string, NodeJS.Timeout>();

export function useTasks() {
  const addTask = ({ id, type, task, delay }: { id: string; type: TaskType; task: () => void; delay: number }) => {
    const taskId = getTaskId({ id, type });

    if (tasks.has(taskId)) return;

    const intervalId = setInterval(task, delay);

    tasks.set(taskId, intervalId);
  };

  const removeTask = ({ id, type }: { id: string; type: TaskType }) => {
    const taskId = getTaskId({ id, type });

    if (!tasks.has(taskId)) return;

    const intervalId = tasks.get(taskId);

    clearInterval(intervalId);

    tasks.delete(taskId);
  };

  return {
    tasks,
    addTask,
    removeTask,
  };
}

export enum TaskType {
  ProviderStatusCheck = 'ProviderStatusCheck',
}

function getTaskId({ id, type }: { id: string; type: TaskType }) {
  return `${type}_${id}`;
}

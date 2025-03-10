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

const tasks = new Map<string, NodeJS.Timeout>();

export function useTasks() {
  const addTask = ({ id, task, delay }: { id: string; task: () => void; delay: number }) => {
    if (tasks.has(id)) return;

    const intervalId = setInterval(task, delay);

    tasks.set(id, intervalId);
  };

  const removeTask = ({ id }: { id: string }) => {
    if (!tasks.has(id)) return;

    const intervalId = tasks.get(id);

    clearInterval(intervalId);

    tasks.delete(id);
  };

  return {
    tasks,
    addTask,
    removeTask,
  };
}

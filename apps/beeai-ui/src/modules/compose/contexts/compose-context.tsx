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

import { createContext } from 'react';
import type { UseFieldArrayReturn } from 'react-hook-form';

import type { Agent } from '#modules/agents/api/types.ts';
import type { RunStats } from '#modules/run/types.ts';

export const ComposeContext = createContext<ComposeContextValue | null>(null);

export type RunStatus = 'ready' | 'pending' | 'finished';
interface ComposeContextValue {
  result?: string;
  status: RunStatus;
  stepsFields: UseFieldArrayReturn<SequentialFormValues, 'steps'>;
  onSubmit: () => void;
  onCancel: () => void;
  onClear: () => void;
  onReset: () => void;
}

export interface ComposeStep {
  data: Agent;
  isPending?: boolean;
  logs?: string[];
  result?: string;
  stats?: RunStats;
  instruction: string;
}

export interface SequentialFormValues {
  steps: ComposeStep[];
}

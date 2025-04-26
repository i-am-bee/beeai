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

export interface WorkflowStep {
  agent_name: string;
  instruction: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  created_at: string;
  updated_at: string;
}

export interface WorkflowCreate {
  name: string;
  description?: string;
  steps: WorkflowStep[];
}

export interface WorkflowUpdate {
  name?: string;
  description?: string;
  steps?: WorkflowStep[];
}

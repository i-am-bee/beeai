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

import type { JSONSchema } from '#helpers/validateJsonSchema.ts';
import { validateJsonSchema } from '#helpers/validateJsonSchema.ts';
import type { Agent } from '#modules/agents/api/types.ts';
import { UiType } from '#modules/run/types.ts';
import { SEQUENTIAL_COMPOSE_AGENT_NAME, textInputJsonSchema, textOutputJsonSchema } from './constants';

export function isValidForSequentialWorkflow(agent: Agent) {
  return (
    agent.ui?.type === UiType.HandsOff ||
    (validateJsonSchema(agent.inputSchema as JSONSchema, textInputJsonSchema as JSONSchema) &&
      validateJsonSchema(agent.outputSchema as JSONSchema, textOutputJsonSchema as JSONSchema))
  );
}

export function getSequentialComposeAgent(agents?: Agent[]) {
  return agents?.find(({ name }) => name === SEQUENTIAL_COMPOSE_AGENT_NAME);
}

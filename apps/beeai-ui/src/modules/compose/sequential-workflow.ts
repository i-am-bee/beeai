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

import { JSONSchema, validateJsonSchema } from '#helpers/validateJsonSchema.ts';
import { Agent } from '@i-am-bee/acp-sdk/types.js';
import { messageInputSchema, messageOutputSchema } from '@i-am-bee/beeai-sdk/schemas/message';
import { textInputSchema, textOutputSchema } from '@i-am-bee/beeai-sdk/schemas/text';
import zodToJsonSchema from 'zod-to-json-schema';

export const SEQUENTIAL_COMPOSE_AGENT_NAME = 'sequential-workflow';

export function getSequentialComposeAgent(agents?: Agent[]) {
  return agents?.find(({ name }) => name === SEQUENTIAL_COMPOSE_AGENT_NAME);
}

const messageInputJsonSchema = zodToJsonSchema(messageInputSchema);
const messageOutputJsonSchema = zodToJsonSchema(messageOutputSchema);
const textInputJsonSchema = zodToJsonSchema(textInputSchema);
const textOutputJsonSchema = zodToJsonSchema(textOutputSchema);

export function isValidForSequentialWorkflow(agent: Agent) {
  return (
    (validateJsonSchema(agent.inputSchema as JSONSchema, messageInputJsonSchema as JSONSchema) &&
      validateJsonSchema(agent.outputSchema as JSONSchema, messageOutputJsonSchema as JSONSchema)) ||
    (validateJsonSchema(agent.inputSchema as JSONSchema, textInputJsonSchema as JSONSchema) &&
      validateJsonSchema(agent.outputSchema as JSONSchema, textOutputJsonSchema as JSONSchema))
  );
}

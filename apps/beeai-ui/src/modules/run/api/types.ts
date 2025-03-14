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

import { AgentRunProgressNotificationSchema, RunAgentResultSchema } from '@i-am-bee/acp-sdk/types.js';
import { messageOutputSchema } from '@i-am-bee/beeai-sdk/schemas/message';
import { textOutputSchema } from '@i-am-bee/beeai-sdk/schemas/text';
import { z } from 'zod';

export const textNotificationSchema = AgentRunProgressNotificationSchema.extend({
  // The text in delta should always be a string, but the agent could actually return undefined.
  params: z.object({ delta: textOutputSchema.partial({ text: true }) }),
});
export type TextNotificationSchema = typeof textNotificationSchema;
export type TextNotification = z.infer<TextNotificationSchema>;
export type TextNotificationLogs = Exclude<TextNotification['params']['delta']['logs'][number], null>[];

export const textResultSchema = RunAgentResultSchema.extend({ output: textOutputSchema });
export type TextResult = z.infer<typeof textResultSchema>;

export const messagesNotificationSchema = AgentRunProgressNotificationSchema.extend({
  params: z.object({ delta: messageOutputSchema }),
});
export type MessagesNotificationSchema = typeof messagesNotificationSchema;

export const messagesResultSchema = RunAgentResultSchema.extend({ output: messageOutputSchema });
export type MessagesResult = z.infer<typeof messagesResultSchema>;

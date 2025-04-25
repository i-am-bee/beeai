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

import type { MessageInput } from '@i-am-bee/beeai-sdk/schemas/message';

export interface MessageBase {
  key: string;
  content: string;
  error?: Error;
}
export interface ClientMessage extends MessageBase {
  role: 'user';
}
export interface AgentMessage extends MessageBase {
  role: 'assistant';
  status: 'pending' | 'error' | 'aborted' | 'success';
}
export type ChatMessage = ClientMessage | AgentMessage;

export type SendMessageParams = { input: string; config?: MessageInput['config'] };

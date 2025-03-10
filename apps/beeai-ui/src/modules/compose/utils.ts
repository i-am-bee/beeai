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

import { MessagesResult } from '#modules/run/api/types.ts';
import { ComposeNotificationDelta, ComposeResult } from './types';

export function isComposeMessageResult(result: ComposeResult): result is MessagesResult {
  return Array.isArray(result.output.messages);
}

export function getComposeResultText(result: ComposeResult) {
  return isComposeMessageResult(result) ? result.output.messages.at(-1)?.content : result.output.text;
}

export function getComposeDeltaResultText(result: ComposeNotificationDelta) {
  return Array.isArray(result.messages) ? result.messages.at(-1)?.content : (result.text ?? '');
}

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

import { Updater } from '@/hooks/useImmerWithGetter';
import { Agent } from '@/modules/agents/api/types';
import { createContext } from 'react';
import { ChatMessage } from '../chat/types';

export const ChatContext = createContext<ChatContextValue | null>(null);

export const ChatMessagesContext = createContext<ChatMessage[]>([]);

interface ChatContextValue {
  agent: Agent;
  isPending?: boolean;
  getMessages: () => ChatMessage[];
  onClear: () => void;
  onCancel: () => void;
  setMessages: Updater<ChatMessage[]>;
  sendMessage: (input: string) => Promise<void>;
}

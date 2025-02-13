import { Updater } from '@/hooks/useImmerWithGetter';
import { Agent } from '@/modules/agents/api/types';
import { createContext } from 'react';

export const ChatContext = createContext<ChatContextValue | null>(null);

export const ChatMessagesContext = createContext<ChatMessage[]>([]);

interface ChatContextValue {
  agent: Agent;
  isPending?: boolean;
  getMessages: () => ChatMessage[];
  onClear: () => void;
  setMessages: Updater<ChatMessage[]>;
  sendMessage: (input: string) => Promise<void>;
}

export interface MessageBase {
  key: string;
  content: string;
  error?: Error;
}
export interface ClientMessage extends MessageBase {
  role: 'user';
}
export interface AgentMessage extends MessageBase {
  role: 'agent';
  isPending?: boolean;
}
export type ChatMessage = ClientMessage | AgentMessage;

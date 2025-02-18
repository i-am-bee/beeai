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

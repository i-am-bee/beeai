import { AgentRunProgressNotificationSchema, RunAgentResultSchema } from '@i-am-bee/acp-sdk/types.js';
import { messageOutputSchema } from '@i-am-bee/beeai-sdk/schemas/message';
import { z } from 'zod';

export const messagesNotificationsSchema = AgentRunProgressNotificationSchema.extend({
  params: z.object({ delta: messageOutputSchema }),
});
export type MessagesNotifications = typeof messagesNotificationsSchema;

export const messagesResultSchema = RunAgentResultSchema.extend({ output: messageOutputSchema });
export type MessagesResult = z.infer<typeof messagesResultSchema>;

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

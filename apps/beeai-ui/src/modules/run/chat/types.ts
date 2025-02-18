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
  status: 'pending' | 'error' | 'aborted' | 'success';
}
export type ChatMessage = ClientMessage | AgentMessage;

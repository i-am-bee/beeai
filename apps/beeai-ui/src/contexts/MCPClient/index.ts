import { use } from 'react';
import { MCPClientContext } from './mcp-client-context';

export function useMCPClient() {
  return use(MCPClientContext);
}

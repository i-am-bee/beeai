import { use } from 'react';
import { MCPClientContext } from './mcp-client-context';

export function useMCPClientContext() {
  return use(MCPClientContext);
}

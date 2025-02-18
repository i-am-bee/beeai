import { Client as MCPClient } from '@i-am-bee/acp-sdk/client/index.js';
import { createContext } from 'react';

export const MCPClientContext = createContext<MCPClient | null>(null);

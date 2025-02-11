import { ListAgentsRequest } from '@agentcommunicationprotocol/sdk/types.js';

import { Agent as SdkAgent } from '@agentcommunicationprotocol/sdk/types.js';

export type Agent = SdkAgent & {
  id: string;
  metadata?: {
    avgRunTime?: number;
    avgRunTokens?: number;
    author?: string;
  };
};

export type ListAgentsParams = ListAgentsRequest['params'];

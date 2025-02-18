import { ListAgentsRequest } from '@i-am-bee/acp-sdk/types.js';
import { Agent as SdkAgent } from '@i-am-bee/acp-sdk/types.js';
import { Metadata } from '@i-am-bee/beeai-sdk/schemas/metadata';

export type Agent = SdkAgent & Metadata;

export type ListAgentsParams = ListAgentsRequest['params'];

export interface CreateProviderBody {
  location: string;
}

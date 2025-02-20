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

import { ListAgentsRequest, Agent as SdkAgent } from '@i-am-bee/acp-sdk/types.js';
import { Metadata } from '@i-am-bee/beeai-sdk/schemas/metadata';

export type Agent = SdkAgent & Metadata;

export type ListAgentsParams = ListAgentsRequest['params'];

export interface CreateProviderBody {
  location: string;
}

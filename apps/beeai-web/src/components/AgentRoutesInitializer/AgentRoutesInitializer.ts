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

'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { InitAgentRoutesResponse } from '@/app/api/init-agents/route';

interface Props {
  initialized: boolean;
}

export function AgentRoutesInitializer({ initialized }: Props) {
  const path = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!initialized)
      fetch('/api/init-agents')
        .then((response) => response.json())
        .then((data: InitAgentRoutesResponse) => {
          if (path.startsWith('/agents') && data.result) {
            router.refresh();
          }
        });
  }, [path, router, initialized]);

  return null;
}

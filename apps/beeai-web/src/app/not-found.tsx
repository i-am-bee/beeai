/**
 * Copyright 2025 © BeeAI a Series of LF Projects, LLC
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

import { ArrowRight } from '@carbon/icons-react';
import { Button } from '@carbon/react';
import { ErrorPage } from '@i-am-bee/beeai-ui';

import { TransitionLink } from '@/components/TransitionLink/TransitionLink';
import { MainContent } from '@/layouts/MainContent';

export default function NotFoundPage() {
  return (
    <MainContent>
      <ErrorPage
        renderButton={({ className }) => (
          <Button as={TransitionLink} href="/" renderIcon={ArrowRight} className={className}>
            Buzz back to safety!
          </Button>
        )}
      />
    </MainContent>
  );
}

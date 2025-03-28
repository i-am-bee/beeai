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

import { useLocation } from 'react-router';

import type { MainContentViewProps } from '#components/MainContentView/MainContentView.tsx';
import { MainContentView } from '#components/MainContentView/MainContentView.tsx';
import { routes } from '#utils/router.ts';

export function MainContent({ ...props }: MainContentViewProps) {
  const { pathname } = useLocation();
  const isAgentsRoute = pathname === routes.agents();

  return <MainContentView enableToTopButton={isAgentsRoute} {...props} />;
}

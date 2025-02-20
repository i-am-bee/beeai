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

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { BrowserRouter, Route, Routes } from 'react-router';
import { ErrorFallback } from './components/fallbacks/ErrorFallback';
import { AppLayout } from './components/layouts/AppLayout';
import { MCPClientProvider } from './contexts/MCPClient/MCPClientProvider';
import { ModalProvider } from './contexts/Modal/ModalProvider';
import { ToastProvider } from './contexts/Toast/ToastProvider';
import { Agents } from './pages/Agents';
import { Agent } from './pages/agents/Agent';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import { AgentRunPage } from './pages/run/AgentRunPage';
import { routeDefinitions } from './utils/router';

const queryClient = new QueryClient();

export function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <MCPClientProvider>
          <ToastProvider>
            <ModalProvider>
              <BrowserRouter>
                <Routes>
                  <Route element={<AppLayout />}>
                    <Route path={routeDefinitions.home()} element={<Home />} />
                    <Route path={routeDefinitions.agents()} element={<Agents />} />
                    <Route path={routeDefinitions.agentDetail()} element={<Agent />} />
                    <Route path={routeDefinitions.agentRun()} element={<AgentRunPage />} />

                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </ModalProvider>
          </ToastProvider>
        </MCPClientProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

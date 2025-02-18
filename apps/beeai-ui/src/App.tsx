import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { BrowserRouter, Route, Routes } from 'react-router';
import { ErrorFallback } from './components/fallbacks/ErrorFallback';
import { AppLayout } from './components/layouts/AppLayout';
import { MCPClientProvider } from './contexts/MCPClient/MCPClientProvider';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import { routesDefinitions } from './utils/router';
import { Agent } from './pages/agents/Agent';
import { ModalProvider } from './contexts/Modal/ModalProvider';
import { AgentRunPage } from './pages/run/AgentRunPage';
import { ToastProvider } from './contexts/Toast/ToastProvider';

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
                    <Route path={routesDefinitions.home()} element={<Home />} />
                    <Route path={routesDefinitions.agentDetail()} element={<Agent />} />
                    <Route path={routesDefinitions.agentRun()} element={<AgentRunPage />} />

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

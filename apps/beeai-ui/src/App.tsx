import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { BrowserRouter, Route, Routes } from 'react-router';
import { ErrorFallback } from './components/fallbacks/ErrorFallback';
import { MCPFallback } from './components/fallbacks/MCPFallback';
import { AppLayout } from './components/layouts/AppLayout';
import { MCPClientProvider } from './contexts/MCPClient/MCPClientProvider';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import { routesDefinition } from './utils/router';
import { Agent } from './pages/agents/Agent';
import { ModalProvider } from './contexts/Modal/ModalProvider';
import { ToastProvider } from './contexts/Toast/ToastProvider';

const queryClient = new QueryClient();

export function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <MCPClientProvider fallback={<MCPFallback />}>
          <ToastProvider>
            <ModalProvider>
              <BrowserRouter>
                <Routes>
                  <Route element={<AppLayout />}>
                    <Route path={routesDefinition.home()} element={<Home />} />
                    <Route path={routesDefinition.agentDetail()} element={<Agent />} />

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

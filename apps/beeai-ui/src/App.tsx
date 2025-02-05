import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { BrowserRouter, Route, Routes } from 'react-router';
import { ErrorFallback } from './components/fallbacks/ErrorFallback';
import { MCPFallback } from './components/fallbacks/MCPFallback';
import { AppLayout } from './components/layouts/AppLayout';
import { MCPClientProvider } from './contexts/MCPClient/MCPClientProvider';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import { routes } from './utils/routes';
import { Agent } from './pages/agents/Agent';
import { ModalProvider } from './contexts/Modal/ModalProvider';

const queryClient = new QueryClient();

export function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <MCPClientProvider fallback={<MCPFallback />}>
          <ModalProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route path={routes.home()} element={<Home />} />
                  <Route path={routes.agentDetail()} element={<Agent />} />

                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ModalProvider>
        </MCPClientProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

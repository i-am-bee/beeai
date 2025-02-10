import { ErrorLayout } from '../layouts/ErrorLayout';

export function MCPFallback() {
  return (
    <ErrorLayout>
      <h1>Connecting to MCP...</h1>
    </ErrorLayout>
  );
}

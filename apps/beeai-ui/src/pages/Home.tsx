import { Container } from '@/components/layouts/Container';
import { ToolsView } from '@/modules/tools/components/ToolsView';

export function Home() {
  return (
    <Container>
      <h1>Welcome to {__APP_NAME__}!</h1>

      <ToolsView />
    </Container>
  );
}

import { AgentRun } from '@/modules/run/AgentRun';
import { routes } from '@/utils/router';
import { useNavigate, useParams } from 'react-router';

type Params = {
  agentName: string;
};

export function AgentRunPage() {
  const { agentName } = useParams<Params>();
  const navigate = useNavigate();

  if (!agentName) {
    navigate(routes.notFound(), { replace: true });
    return null;
  }

  return <AgentRun name={agentName} />;
}

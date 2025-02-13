import { AgentDetail } from '@/modules/agents/detail/AgentDetail';
import { routes } from '@/utils/router';
import { useNavigate, useParams } from 'react-router';

type Params = {
  agentName: string;
};

export function Agent() {
  const { agentName } = useParams<Params>();
  const navigate = useNavigate();

  if (!agentName) {
    navigate(routes.notFound(), { replace: true });
    return null;
  }

  return <AgentDetail name={agentName} />;
}

import { AgentDetail } from '@/modules/agents/detail/AgentDetail';
import { routes } from '@/utils/router';
import { useNavigate, useParams } from 'react-router';

type Params = {
  agentId: string;
};

export function Agent() {
  const { agentId } = useParams<Params>();
  const navigate = useNavigate();

  if (!agentId) {
    navigate(routes.notFound(), { replace: true });
    return null;
  }

  return <AgentDetail id={agentId} />;
}

from typing import TYPE_CHECKING, Any

from acp.server.highlevel.agents.base import Agent
from acp.server.highlevel.agents.templates import AgentTemplate
from acp.server.highlevel.exceptions import AgentError
from acp.server.highlevel.utilities.logging import get_logger

if TYPE_CHECKING:
    from acp.server.highlevel.server import Context

logger = get_logger(__name__)


class AgentManager:
    """Manages FastMCP agents."""

    def __init__(self, warn_on_duplicate_agents: bool = True):
        self._agents: dict[str, Agent] = {}
        self._templates: dict[str, AgentTemplate] = {}
        self.warn_on_duplicate_agents = warn_on_duplicate_agents

    def get_template(self, name: str) -> AgentTemplate | None:
        """Get agent template by name."""
        return self._templates.get(name)

    def list_templates(self) -> list[AgentTemplate]:
        """List all registered agent templates."""
        return list(self._templates.values())

    def add_template(
        self,
        template: AgentTemplate,
    ) -> AgentTemplate:
        """Add a template to the server."""
        existing = self._templates.get(template.name)
        if existing:
            if self.warn_on_duplicate_agents:
                logger.warning(f"Agent template already exists: {template.name}")
            return existing
        self._templates[template.name] = template
        return template

    def get_agent(self, name: str) -> Agent | None:
        """Get agent by name."""
        return self._agents.get(name)

    def list_agents(self) -> list[Agent]:
        """List all registered agents."""
        return list(self._agents.values())

    def add_agent(
        self,
        agent: Agent,
    ) -> Agent:
        """Add an agent to the server."""
        existing = self._agents.get(agent.name)
        if existing:
            if self.warn_on_duplicate_agents:
                logger.warning(f"Agent already exists: {agent.name}")
            return existing
        self._agents[agent.name] = agent
        return agent

    async def create_agent(
        self, name: str, config: dict[str, Any], context: "Context"
    ) -> Agent:
        """Call an agent by name with arguments."""
        template = self.get_template(name)
        if not template:
            raise AgentError(f"Unknown agent template: {name}")

        agent = await template.create_fn(template.model_validate(config), context)
        existing = self._agents.get(agent.name)
        if existing:
            if self.warn_on_duplicate_agents:
                logger.warning(f"Agent already exists: {agent.name}")
            return existing
        self._agents[agent.name] = agent
        return agent

    async def destroy_agent(self, name: str, context: "Context") -> None:
        """Call an agent by name with arguments."""
        agent = self.get_agent(name)
        if not agent:
            raise AgentError(f"Unknown agent: {name}")

        if not agent.destroy_fn:
            raise AgentError(f"Agent cannot be destroyed: {name}")

        try:
            await agent.destroy_fn(context)
        except Exception as e:
            logger.warning(f"Error destroying agent {name}: {e}")
        finally:
            del self._agents[name]
        return

    async def run_agent(
        self, name: str, input: dict[str, Any], context: "Context"
    ) -> Any:
        """Run an agent by name with input."""
        agent = self.get_agent(name)
        if not agent:
            raise AgentError(f"Unknown agent: {name}")

        try:
            output = await agent.run_fn(agent.input.model_validate(input), context)
            return output.model_dump()
        except Exception as e:
            raise AgentError(f"Error running agent {name}: {e}") from e

from beeai_sdk.providers.agent import Server
from sequential_workflow.agent import add_sequential_workflow_agent


server = Server("composition-agents")
add_sequential_workflow_agent(server)

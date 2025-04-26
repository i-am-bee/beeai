# Copyright 2025 © BeeAI a Series of LF Projects, LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import logging
from typing import List, Optional

from kink import inject

from beeai_server.adapters.repositories.workflow import WorkflowRepository
from beeai_server.schema import Workflow, WorkflowCreate, WorkflowUpdate

logger = logging.getLogger(__name__)


@inject
class WorkflowService:
    """Service for workflow operations."""

    def __init__(self, workflow_repository: WorkflowRepository):
        self.workflow_repository = workflow_repository

    async def create_workflow(self, workflow_create: WorkflowCreate) -> Workflow:
        """Create a new workflow."""
        logger.info(f"Creating workflow: {workflow_create.name}")
        return await self.workflow_repository.create(workflow_create)

    async def get_workflow(self, workflow_id: str) -> Optional[Workflow]:
        """Get a workflow by ID."""
        logger.info(f"Getting workflow with ID: {workflow_id}")
        return await self.workflow_repository.get_by_id(workflow_id)

    async def list_workflows(self, skip: int = 0, limit: int = 100) -> List[Workflow]:
        """List workflows with pagination."""
        logger.info(f"Listing workflows (skip={skip}, limit={limit})")
        return await self.workflow_repository.list(skip, limit)

    async def update_workflow(self, workflow_id: str, workflow_update: WorkflowUpdate) -> Optional[Workflow]:
        """Update a workflow."""
        logger.info(f"Updating workflow with ID: {workflow_id}")
        return await self.workflow_repository.update(workflow_id, workflow_update)

    async def delete_workflow(self, workflow_id: str) -> bool:
        """Delete a workflow."""
        logger.info(f"Deleting workflow with ID: {workflow_id}")
        return await self.workflow_repository.delete(workflow_id)

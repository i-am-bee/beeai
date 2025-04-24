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

from datetime import datetime, timezone
from typing import List, Optional
from uuid import uuid4

from sqlalchemy import select, delete, update
from sqlalchemy.orm import sessionmaker

from beeai_server.adapters.repositories.base import Repository
from beeai_server.models.workflow import WorkflowModel
from beeai_server.schema import Workflow, WorkflowCreate, WorkflowUpdate, WorkflowStep


class WorkflowRepository(Repository[Workflow, WorkflowCreate, WorkflowUpdate]):
    """Repository for workflow persistence using SQLAlchemy."""

    def __init__(self, session_factory: sessionmaker):
        self.session_factory = session_factory

    async def create(self, workflow_create: WorkflowCreate) -> Workflow:
        """Create a new workflow."""
        async with self.session_factory() as session:
            workflow_id = str(uuid4())
            now = datetime.now(timezone.utc)

            db_workflow = WorkflowModel(
                id=workflow_id,
                name=workflow_create.name,
                description=workflow_create.description,
                steps=[step.model_dump() for step in workflow_create.steps],
                created_at=now,
                updated_at=now,
            )

            session.add(db_workflow)
            await session.commit()

            return Workflow(
                id=workflow_id,
                name=db_workflow.name,
                description=db_workflow.description,
                steps=workflow_create.steps,
                created_at=now,
                updated_at=now,
            )

    async def get_by_id(self, workflow_id: str) -> Optional[Workflow]:
        """Get a workflow by ID."""
        async with self.session_factory() as session:
            result = await session.execute(select(WorkflowModel).where(WorkflowModel.id == workflow_id))
            db_workflow = result.scalar_one_or_none()

            if not db_workflow:
                return None

            return Workflow(
                id=db_workflow.id,
                name=db_workflow.name,
                description=db_workflow.description,
                steps=[WorkflowStep(**step) for step in db_workflow.steps],
                created_at=db_workflow.created_at,
                updated_at=db_workflow.updated_at,
            )

    async def list(self, skip: int = 0, limit: int = 100) -> List[Workflow]:
        """List workflows with pagination."""
        async with self.session_factory() as session:
            result = await session.execute(
                select(WorkflowModel).order_by(WorkflowModel.created_at.desc()).offset(skip).limit(limit)
            )
            db_workflows = result.scalars().all()

            return [
                Workflow(
                    id=db_workflow.id,
                    name=db_workflow.name,
                    description=db_workflow.description,
                    steps=[WorkflowStep(**step) for step in db_workflow.steps],
                    created_at=db_workflow.created_at,
                    updated_at=db_workflow.updated_at,
                )
                for db_workflow in db_workflows
            ]

    async def update(self, workflow_id: str, workflow_update: WorkflowUpdate) -> Optional[Workflow]:
        """Update a workflow."""
        update_values = workflow_update.model_dump(exclude_unset=True)
        update_values["updated_at"] = datetime.now(timezone.utc)

        if "steps" in update_values:
            update_values["steps"] = [step.model_dump() for step in workflow_update.steps]

        async with self.session_factory() as session:
            result = await session.execute(
                update(WorkflowModel)
                .where(WorkflowModel.id == workflow_id)
                .values(**update_values)
                .returning(WorkflowModel)
            )

            await session.commit()
            db_workflow = result.scalar_one_or_none()

            if not db_workflow:
                return None

            return await self.get_by_id(workflow_id)

    async def delete(self, workflow_id: str) -> bool:
        """Delete a workflow."""
        async with self.session_factory() as session:
            result = await session.execute(delete(WorkflowModel).where(WorkflowModel.id == workflow_id))
            await session.commit()

            return result.rowcount > 0

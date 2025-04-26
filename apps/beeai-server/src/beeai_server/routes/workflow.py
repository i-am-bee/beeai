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
from typing import Annotated

import fastapi
from fastapi import Depends, HTTPException, status, Query
from kink import di

from beeai_server.schema import PaginatedResponse, Workflow, WorkflowCreate, WorkflowUpdate
from beeai_server.services.workflow import WorkflowService

logger = logging.getLogger(__name__)

router = fastapi.APIRouter()


# Use dependency injection to get the service in each handler
def get_workflow_service() -> WorkflowService:
    return di[WorkflowService]


@router.post("", status_code=status.HTTP_201_CREATED, response_model=Workflow)
async def create_workflow(
    workflow_create: WorkflowCreate, workflow_service: WorkflowService = Depends(get_workflow_service)
):
    """Create a new workflow."""
    try:
        return await workflow_service.create_workflow(workflow_create)
    except Exception as e:
        logger.error(f"Error creating workflow: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create workflow: {str(e)}")


@router.get("", response_model=PaginatedResponse[Workflow])
async def list_workflows(
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    workflow_service: WorkflowService = Depends(get_workflow_service),
):
    """List workflows with pagination."""
    try:
        workflows = await workflow_service.list_workflows(skip, limit)
        return PaginatedResponse(items=workflows, total_count=len(workflows))
    except Exception as e:
        logger.error(f"Error listing workflows: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list workflows: {str(e)}")


@router.get("/{workflow_id}", response_model=Workflow)
async def get_workflow(workflow_id: str, workflow_service: WorkflowService = Depends(get_workflow_service)):
    """Get a workflow by ID."""
    try:
        workflow = await workflow_service.get_workflow(workflow_id)
        if workflow is None:
            raise HTTPException(status_code=404, detail="Workflow not found")
        return workflow
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting workflow {workflow_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get workflow: {str(e)}")


@router.put("/{workflow_id}", response_model=Workflow)
async def update_workflow(
    workflow_id: str, workflow_update: WorkflowUpdate, workflow_service: WorkflowService = Depends(get_workflow_service)
):
    """Update a workflow."""
    try:
        updated_workflow = await workflow_service.update_workflow(workflow_id, workflow_update)
        if updated_workflow is None:
            raise HTTPException(status_code=404, detail="Workflow not found")
        return updated_workflow
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating workflow {workflow_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update workflow: {str(e)}")


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow(workflow_id: str, workflow_service: WorkflowService = Depends(get_workflow_service)):
    """Delete a workflow."""
    try:
        success = await workflow_service.delete_workflow(workflow_id)
        if not success:
            raise HTTPException(status_code=404, detail="Workflow not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting workflow {workflow_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete workflow: {str(e)}")

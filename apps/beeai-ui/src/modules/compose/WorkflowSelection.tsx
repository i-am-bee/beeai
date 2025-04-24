/**
 * Copyright 2025 © BeeAI a Series of LF Projects, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Add, ArrowLeft, ErrorFilled, Flow, Time, Tools, TrashCan } from '@carbon/icons-react';
import { Button, InlineLoading, Modal, Tile } from '@carbon/react';
import { useState } from 'react';

import { Container } from '#components/layouts/Container.tsx';
import { MainContent } from '#components/layouts/MainContent.tsx';
import { TransitionLink } from '#components/TransitionLink/TransitionLink.tsx';
import { VersionTag } from '#components/VersionTag/VersionTag.tsx';
import { routes } from '#utils/router.ts';

import { useDeleteWorkflow } from '../workflows/api/queries/useDeleteWorkflow';
import { useListWorkflows } from '../workflows/api/queries/useListWorkflows';
import classes from './WorkflowSelection.module.scss';

export function WorkflowSelection() {
  const { data, isLoading, error } = useListWorkflows();
  const deleteWorkflow = useDeleteWorkflow();
  const workflowItems = data?.items || [];

  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleDeleteClick = (workflowId: string) => {
    setWorkflowToDelete(workflowId);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (workflowToDelete) {
      await deleteWorkflow.mutateAsync(workflowToDelete);
      setDeleteModalOpen(false);
      setWorkflowToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setWorkflowToDelete(null);
  };

  return (
    <MainContent>
      <Container>
        <div className={classes.container}>
          <div className={classes.header}>
            <TransitionLink href={routes.compose()} asChild>
              <Button kind="ghost" renderIcon={ArrowLeft} className={classes.backButton}>
                Back
              </Button>
            </TransitionLink>

            <h1 className={classes.title}>
              Sequential Workflow <VersionTag>alpha</VersionTag>
            </h1>
          </div>

          <div className={classes.newWorkflowSection}>
            <Flow size={32} />
            <h2>Create a New Workflow</h2>
            <p className={classes.description}>Build a custom sequence of agents that process data in steps</p>
            <TransitionLink href={routes.composeSequential()} asChild>
              <Button className={classes.newWorkflowButton} kind="primary" renderIcon={Add} size="lg">
                New Workflow
              </Button>
            </TransitionLink>
          </div>

          <div className={classes.divider} />

          <h2 className={classes.subtitle}>Your Saved Workflows</h2>

          <div className={classes.workflowsContainer}>
            {isLoading ? (
              <div className={classes.loadingContainer}>
                <InlineLoading description="Loading workflows..." />
              </div>
            ) : error ? (
              <div className={classes.error}>
                <ErrorFilled size={20} />
                Failed to load workflows. Please try again.
              </div>
            ) : workflowItems.length === 0 ? (
              <div className={classes.emptyState}>
                <Tools size={32} />
                <p>You don't have any saved workflows yet</p>
                <TransitionLink href={routes.composeSequential()} asChild>
                  <Button kind="primary" renderIcon={Add}>
                    Create Your First Workflow
                  </Button>
                </TransitionLink>
              </div>
            ) : (
              <div className={classes.workflowList}>
                {workflowItems.map((workflow) => (
                  <Tile className={classes.horizontalWorkflowTile} key={workflow.id}>
                    <div className={classes.workflowContent}>
                      <div className={classes.workflowInfo}>
                        <h3 className={classes.workflowTitle}>{workflow.name}</h3>
                        {workflow.description && <p className={classes.workflowDescription}>{workflow.description}</p>}
                      </div>
                      <div className={classes.workflowDetails}>
                        <div className={classes.workflowMeta}>
                          <span className={classes.workflowSteps}>
                            {workflow.steps.length} {workflow.steps.length === 1 ? 'step' : 'steps'}
                          </span>
                          <div className={classes.workflowDate}>
                            <Time size={16} />
                            {new Intl.DateTimeFormat(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'medium',
                            }).format(new Date(workflow.created_at))}
                          </div>
                        </div>
                        <div className={classes.workflowActions}>
                          <TransitionLink href={`${routes.composeSequential()}?workflowId=${workflow.id}`} asChild>
                            <Button kind="primary" className={classes.workflowButton}>
                              Open Workflow
                            </Button>
                          </TransitionLink>
                          <Button
                            kind="danger--ghost"
                            renderIcon={TrashCan}
                            iconDescription="Delete Workflow"
                            onClick={() => handleDeleteClick(workflow.id)}
                            className={classes.deleteButton}
                            size="md"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Tile>
                ))}
              </div>
            )}
          </div>
        </div>
      </Container>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteModalOpen}
        modalHeading="Delete Workflow?"
        primaryButtonText="Delete"
        secondaryButtonText="Cancel"
        primaryButtonDisabled={deleteWorkflow.isPending}
        danger
        onRequestSubmit={handleConfirmDelete}
        onRequestClose={handleCancelDelete}
        size="sm"
        className={classes.modalRoot}
      >
        <div className={classes.modalContent}>
          <p>Are you sure you want to delete this workflow? This action cannot be undone.</p>
          {deleteWorkflow.isPending && <InlineLoading description="Deleting..." />}
        </div>
      </Modal>
    </MainContent>
  );
}

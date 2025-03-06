/**
 * Copyright 2025 IBM Corp.
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

import { CopySnippet } from '#components/CopySnippet/CopySnippet.tsx';
import { Modal } from '#components/Modal/Modal.tsx';
import { ModalProps } from '#contexts/Modal/modal-context.ts';
import { ArrowUpRight } from '@carbon/icons-react';
import { Button, ModalBody, ModalHeader } from '@carbon/react';
import { Agent } from '../api/types';
import { AgentMetadata } from './AgentMetadata';
import classes from './AgentModal.module.scss';
import { AgentTags } from './AgentTags';

interface Props extends ModalProps {
  agent: Agent;
}

export function AgentModal({ agent, onRequestClose, ...modalProps }: Props) {
  const { id, name, description } = agent;

  const runCommand = `beeai run ${id}`;

  return (
    <Modal {...modalProps}>
      <ModalHeader buttonOnClick={() => onRequestClose()}>
        <h2>{name}</h2>
        <AgentMetadata agent={agent} />
      </ModalHeader>
      <ModalBody>
        <div className={classes.body}>
          <p className={classes.description}>{description}</p>
          <AgentTags agent={agent} />
        </div>
        <div className={classes.runAgent}>
          <CopySnippet>{runCommand}</CopySnippet>

          <Button kind="primary" renderIcon={ArrowUpRight} size="md">
            Try this agent
          </Button>
        </div>
      </ModalBody>
    </Modal>
  );
}

import { Agent } from '../api/types';
import { Modal } from '@/components/Modal/Modal';
import { ArrowUpRight } from '@carbon/icons-react';
import { Button, ModalBody, ModalHeader } from '@carbon/react';
import { AgentMetadata } from './AgentMetadata';
import classes from './AgentModal.module.scss';
import { AgentTags } from './AgentTags';
import { CopySnippet } from '@/components/CopySnippet/CopySnippet';
import { ModalProps } from '@/contexts/Modal/modal-context';

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
          <CopySnippet snippet={runCommand} />

          <Button kind="primary" renderIcon={ArrowUpRight} size="md">
            Try this agent
          </Button>
        </div>
      </ModalBody>
    </Modal>
  );
}

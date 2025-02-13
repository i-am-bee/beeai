import { Button, Layer, ModalBody, ModalHeader } from '@carbon/react';
import { Agent } from '../api/types';
import { ModalProps } from '@/contexts/Modal/ModalContext';
import { Modal } from '@/components/Modal/Modal';
import { AgentMetadata } from './AgentMetadata';
import { AgentTags } from './AgentTags';
import classes from './AgentModal.module.scss';
import { ArrowUpRight } from '@carbon/icons-react';
import { TextWithCopyButton } from '@/components/TextWithCopyButton/TextWithCopyButton';

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
          <Layer level={1}>
            <TextWithCopyButton text={runCommand} isCode>
              {runCommand}
            </TextWithCopyButton>
          </Layer>
          <Button kind="primary" renderIcon={ArrowUpRight} size="md">
            Try this agent
          </Button>
        </div>
      </ModalBody>
    </Modal>
  );
}

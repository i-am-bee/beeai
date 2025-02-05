import { Modal } from '@/components/Modal/Modal';
import { useModal } from '@/contexts/Modal';
import { Button, ModalHeader } from '@carbon/react';

interface Props {
  id: string;
}

export function AgentDetail({ id }: Props) {
  const { openModal } = useModal();
  return (
    <>
      <h1>Agent {id}</h1>
      <Button
        onClick={() =>
          openModal((props) => (
            <Modal {...props}>
              <ModalHeader>Modal</ModalHeader>
            </Modal>
          ))
        }
      >
        Open modal
      </Button>
    </>
  );
}

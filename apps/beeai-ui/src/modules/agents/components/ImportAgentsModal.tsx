import { Button, InlineLoading, ModalBody, ModalFooter, ModalHeader, TextInput } from '@carbon/react';
import { ModalProps } from '@/contexts/Modal/modal-context';
import { Modal } from '@/components/Modal/Modal';
import classes from './AgentModal.module.scss';
import { useImportProvider } from '../api/mutations/useImportAgents';
import { useForm } from 'react-hook-form';
import { useCallback, useId } from 'react';
import { useToast } from '@/contexts/Toast';

export function ImportAgentsModal({ onRequestClose, ...modalProps }: ModalProps) {
  const id = useId();
  const { addToast } = useToast();
  const { mutate, isPending } = useImportProvider({
    onSuccess: () => {
      addToast({ title: 'Provider was imported successfuly' });
      onRequestClose();
    },
  });

  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm<FormValues>({
    mode: 'onChange',
  });

  const onSubmit = useCallback(
    ({ url }: FormValues) => {
      mutate({ location: url });
    },
    [mutate],
  );

  return (
    <Modal {...modalProps} size="md">
      <ModalHeader buttonOnClick={() => onRequestClose()}>
        <h2>Import your agents</h2>
      </ModalHeader>
      <ModalBody className={classes.body}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextInput id={id} labelText="URL" {...register('url', { required: true })} />
        </form>
      </ModalBody>
      <ModalFooter>
        <Button onClick={() => handleSubmit(onSubmit)()} disabled={isPending || !isValid}>
          {isPending ? <InlineLoading description="Importing..." /> : 'Import'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

interface FormValues {
  url: string;
}

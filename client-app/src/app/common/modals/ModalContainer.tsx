import { useStore } from 'app/stores/stores';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Modal } from 'semantic-ui-react';

export default observer(function ModalContainer() {
  const { modalStore } = useStore();

  return (
    <Modal open={modalStore.modal.open} onClose={modalStore.closeModal} size="mini">
      <Modal.Content>{modalStore.modal.body}</Modal.Content>
    </Modal>
  );
});

// DeleteConfirmModal.js
import React from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import './DeleteConfirmModal.css';

const DeleteConfirmModal = ({
  isOpen,
  toggle,
  onConfirm,
  title = "Delete Form",
  message = "Are you sure you want to delete this form?",
  subtitle = "This action cannot be undone.",
  confirmText = "Delete Forever",
  cancelText = "Cancel"
}) => {
  const handleConfirm = () => {
    onConfirm();
    toggle();
  };

  return (
    <Modal
      isOpen={isOpen}
      toggle={toggle}
      className="delete-confirm-modal"
      backdrop="static"
      keyboard={false}
      centered
      size="md"
    >
      <ModalHeader toggle={false} className="delete-modal-header">
        <h3>{title}</h3>
      </ModalHeader>

      <ModalBody className="delete-modal-body">
        <div className="icon-wrapper">
          <i className="ni ni-fat-remove"></i>
        </div>
        <p className="primary-message">{message}</p>
        <p className="secondary-message">{subtitle}</p>
        <div className="warning-badge">
          <i className="ni ni-bell-55"></i>
          <span>Permanent Action</span>
        </div>
      </ModalBody>

      <ModalFooter className="delete-modal-footer">
        <Button onClick={toggle} className="btn-cancel">
          <i className="ni ni-curved-next"></i> {cancelText}
        </Button>
        <Button onClick={handleConfirm} className="btn-confirm">
          <i className="ni ni-fat-remove"></i> {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DeleteConfirmModal;

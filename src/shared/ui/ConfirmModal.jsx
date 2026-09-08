import Modal from "./Modal";

export default function ConfirmModal({ open, title, message, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="users-confirm-text">{message}</p>
      <div className="users-form-actions">
        <button type="button" className="users-btn users-btn--ghost" onClick={onCancel}>
          Cancelar
        </button>
        <button type="button" className="users-btn users-btn--danger" onClick={onConfirm}>
          Eliminar
        </button>
      </div>
    </Modal>
  );
}

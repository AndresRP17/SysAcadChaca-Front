import Modal from "../common/Modal";

export default function ConfirmDeleteModal({ open, user, onCancel, onConfirm }) {
  if (!user) return null;

  return (
    <Modal open={open} title="Eliminar usuario" onClose={onCancel}>
      <p className="users-confirm-text">
        ¿Seguro que querés eliminar a <strong>{user.nombre} {user.apellido}</strong>{" "}
        (legajo {user.legajo})? Esta acción no se puede deshacer.
      </p>
      <div className="users-form-actions">
        <button type="button" className="users-btn users-btn--ghost" onClick={onCancel}>
          Cancelar
        </button>
        <button
          type="button"
          className="users-btn users-btn--danger"
          onClick={() => onConfirm(user)}
        >
          Eliminar
        </button>
      </div>
    </Modal>
  );
}

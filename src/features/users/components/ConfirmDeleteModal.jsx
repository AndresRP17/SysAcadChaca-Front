import ConfirmModal, { DELETE_NOTE } from "../../../shared/ui/ConfirmModal";

export default function ConfirmDeleteModal({ open, user, onCancel, onConfirm }) {
  if (!user) return null;

  return (
    <ConfirmModal
      open={open}
      title="Eliminar usuario"
      message={
        <>
          ¿Seguro que querés eliminar a <strong>{user.nombre} {user.apellido}</strong>{" "}
          (legajo {user.legajo})? Esta acción no se puede deshacer.
        </>
      }
      note={DELETE_NOTE}
      onCancel={onCancel}
      onConfirm={() => onConfirm(user)}
    />
  );
}

import { useEffect, useState } from "react";
import Modal from "./Modal";
import { getErrorMessage } from "../api/api";

// Aviso estandar para los borrados: el backend rechaza (409) eliminar algo que
// tiene datos asociados, y no hay borrado en cascada.
export const DELETE_NOTE = "Solo se puede eliminar si no tiene datos asociados.";

// onConfirm puede ser async: si rechaza, el modal queda abierto y muestra el
// mensaje de la API (p. ej. el 409 "tiene N planes de estudio asociados"). Si
// resuelve, es responsabilidad del padre cerrarlo (poniendo open en false).
export default function ConfirmModal({ open, title, message, note, confirmLabel = "Eliminar", onCancel, onConfirm }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) setError("");
  }, [open]);

  if (!open) return null;

  async function handleConfirm() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await onConfirm();
    } catch (e) {
      setError(getErrorMessage(e, "No pudimos completar la operación."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="users-confirm-text">{message}</p>
      {note && <p className="users-confirm-text">{note}</p>}
      {error && <p className="users-form-error" role="alert">{error}</p>}
      <div className="users-form-actions">
        <button type="button" className="users-btn users-btn--ghost" onClick={onCancel}>
          Cancelar
        </button>
        <button type="button" className="users-btn users-btn--danger" onClick={handleConfirm} disabled={busy}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

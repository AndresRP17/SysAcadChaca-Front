import { useEffect, useState } from "react";
import Modal from "../../../shared/ui/Modal";
import FieldError from "../../../shared/ui/FieldError";
import { getErrorMessage, getFieldErrors } from "../../../shared/api/api";

// Cancelar la mesa: rechazo masivo de las inscripciones con un motivo (como en
// SIU-Guarani). La mesa no se borra, queda como registro histórico que el
// alumno puede ver junto con el motivo.
export default function CancelActaModal({ open, board, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setReason("");
      setError("");
      setFieldErrors({});
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit() {
    if (!reason.trim()) {
      setError("Ingresá el motivo de la cancelación.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onSubmit(reason.trim());
    } catch (e) {
      setError(getErrorMessage(e));
      setFieldErrors(getFieldErrors(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="Cancelar mesa" onClose={onClose}>
      <p className="users-confirm-text">
        {board?.courseName} — se van a rechazar todas las inscripciones de los alumnos. La mesa queda cancelada
        (no se elimina) y los alumnos ven el motivo en su historial.
      </p>

      {error && <p className="users-form-error">{error}</p>}

      <div className="users-form-field">
        <label className="users-form-label" htmlFor="acta-cancel-reason">
          Motivo
        </label>
        <input
          id="acta-cancel-reason"
          className="users-form-input"
          placeholder="Ej.: paro docente"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <FieldError errors={fieldErrors} field="reason" />
      </div>

      <div className="users-form-actions">
        <button type="button" className="users-btn users-btn--ghost" onClick={onClose}>
          Volver
        </button>
        <button type="button" className="users-btn users-btn--danger" disabled={saving} onClick={handleSubmit}>
          Cancelar mesa
        </button>
      </div>
    </Modal>
  );
}

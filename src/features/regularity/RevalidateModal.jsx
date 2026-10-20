import { useEffect, useState } from "react";
import Modal from "../../shared/ui/Modal";
import FieldError from "../../shared/ui/FieldError";
import { getErrorCode, getErrorMessage, getFieldErrors } from "../../shared/api/api";

const MIN_REASON = 5;

// Mensajes en español de los 409 de la reválida; REGULARITY_NOT_LOST trae del servidor el porqué.
const CODE_MESSAGES = {
  REVALIDATION_NOT_ALLOWED: "La institución no permite revalidar regularidades perdidas.",
};

// Reválida de una regularidad perdida: es una excepción que queda registrada con quién la hizo, cuándo y
// por qué. `item` es la materia (courseName). onConfirm(reason) llama al servidor y puede lanzar.
export default function RevalidateModal({ open, item, onClose, onConfirm }) {
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

  async function handleConfirm() {
    if (reason.trim().length < MIN_REASON) {
      setError(`Indicá el motivo (al menos ${MIN_REASON} caracteres).`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onConfirm(reason.trim());
    } catch (e) {
      setError(CODE_MESSAGES[getErrorCode(e)] ?? getErrorMessage(e, "No pudimos revalidar la regularidad."));
      setFieldErrors(getFieldErrors(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="Revalidar regularidad" onClose={onClose}>
      <p className="users-confirm-text">
        Vas a devolverle al alumno la regularidad perdida de {item?.courseName}. Queda registrado quién lo hizo,
        cuándo y el motivo que escribas.
      </p>

      {error && <p className="users-form-error" role="alert">{error}</p>}

      <div className="users-form-field">
        <label className="users-form-label" htmlFor="revalidate-reason">Motivo</label>
        <input
          id="revalidate-reason"
          className="users-form-input"
          placeholder="Ej.: error de carga en un acta"
          maxLength={255}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <FieldError errors={fieldErrors} field="reason" />
      </div>

      <div className="users-form-actions">
        <button type="button" className="users-btn users-btn--ghost" onClick={onClose}>Cancelar</button>
        <button type="button" className="users-btn users-btn--primary" disabled={saving} onClick={handleConfirm}>
          {saving ? "Revalidando..." : "Revalidar"}
        </button>
      </div>
    </Modal>
  );
}

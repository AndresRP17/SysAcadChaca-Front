import { useEffect, useState } from "react";
import Modal from "../../../shared/ui/Modal/Modal";
import FieldError from "../../../shared/ui/FieldError";
import { getErrorMessage, getFieldErrors } from "../../../shared/api/api";

const MIN_REASON = 5;

// Fuera del periodo de inscripcion solo Bedel y Administrador pueden inscribir, y tiene que quedar
// claro que se esta haciendo una excepcion: se avisa, se pide un motivo y el servidor lo registra
// (quien, cuando y por que). `what` es "la cursada" / "la mesa de final".
export default function OutOfTermModal({ open, what, onClose, onConfirm }) {
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
      setError(getErrorMessage(e, "No pudimos completar la inscripción."));
      setFieldErrors(getFieldErrors(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="Inscripción fuera de término" onClose={onClose}>
      <p className="users-confirm-text">
        El período de inscripción a {what} está cerrado. Vas a inscribir al alumno fuera de término: queda
        registrado quién lo hizo, cuándo y el motivo que escribas.
      </p>

      {error && <p className="users-form-error" role="alert">{error}</p>}

      <div className="users-form-field">
        <label className="users-form-label" htmlFor="out-of-term-reason">
          Motivo
        </label>
        <input
          id="out-of-term-reason"
          className="users-form-input"
          placeholder="Ej.: presentó certificado de trabajo"
          maxLength={255}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <FieldError errors={fieldErrors} field="out_of_term_reason" />
      </div>

      <div className="users-form-actions">
        <button type="button" className="users-btn users-btn--ghost" onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className="users-btn users-btn--danger" disabled={saving} onClick={handleConfirm}>
          Inscribir fuera de término
        </button>
      </div>
    </Modal>
  );
}

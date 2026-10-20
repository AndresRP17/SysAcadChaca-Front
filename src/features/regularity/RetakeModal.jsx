import { useEffect, useState } from "react";
import Modal from "../../shared/ui/Modal";
import FieldError from "../../shared/ui/FieldError";
import { getErrorMessage, getFieldErrors } from "../../shared/api/api";

const MIN_REASON = 5;

// Recursar una materia con la regularidad vigente es una excepción: solo Bedelía o Administrador la
// hacen y queda registrado quién, cuándo y por qué. Si además el período de inscripción está cerrado
// (`outOfTerm`), el mismo modal pide el segundo motivo y se mandan los dos juntos.
// onConfirm({ retakeReason, outOfTermReason }) llama al servidor y puede lanzar.
export default function RetakeModal({ open, courseName, outOfTerm = false, onClose, onConfirm }) {
  const [retakeReason, setRetakeReason] = useState("");
  const [outOfTermReason, setOutOfTermReason] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setRetakeReason("");
      setOutOfTermReason("");
      setError("");
      setFieldErrors({});
    }
  }, [open]);

  if (!open) return null;

  async function handleConfirm() {
    if (retakeReason.trim().length < MIN_REASON || (outOfTerm && outOfTermReason.trim().length < MIN_REASON)) {
      setError(`Indicá ${outOfTerm ? "los dos motivos" : "el motivo"} (al menos ${MIN_REASON} caracteres cada uno).`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onConfirm({ retakeReason: retakeReason.trim(), outOfTermReason: outOfTerm ? outOfTermReason.trim() : null });
    } catch (e) {
      setError(getErrorMessage(e, "No pudimos completar la inscripción."));
      setFieldErrors(getFieldErrors(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="Recursar con regularidad vigente" onClose={onClose}>
      <p className="users-confirm-text">
        El alumno tiene la regularidad vigente de {courseName || "esta materia"}; recursar es una excepción que queda
        registrada con quién y por qué.
        {outOfTerm &&
          " Además, el período de inscripción está cerrado, así que se inscribe fuera de término y también hace falta ese motivo."}
      </p>

      {error && <p className="users-form-error" role="alert">{error}</p>}

      <div className="users-form-field">
        <label className="users-form-label" htmlFor="retake-reason">Motivo para recursar</label>
        <input
          id="retake-reason"
          className="users-form-input"
          placeholder="Ej.: el alumno pidió mejorar su cursada"
          maxLength={255}
          value={retakeReason}
          onChange={(e) => setRetakeReason(e.target.value)}
        />
        <FieldError errors={fieldErrors} field="retake_reason" />
      </div>

      {outOfTerm && (
        <div className="users-form-field">
          <label className="users-form-label" htmlFor="retake-out-of-term-reason">Motivo para inscribir fuera de término</label>
          <input
            id="retake-out-of-term-reason"
            className="users-form-input"
            placeholder="Ej.: presentó certificado de trabajo"
            maxLength={255}
            value={outOfTermReason}
            onChange={(e) => setOutOfTermReason(e.target.value)}
          />
          <FieldError errors={fieldErrors} field="out_of_term_reason" />
        </div>
      )}

      <div className="users-form-actions">
        <button type="button" className="users-btn users-btn--ghost" onClick={onClose}>Cancelar</button>
        <button type="button" className="users-btn users-btn--danger" disabled={saving} onClick={handleConfirm}>
          {outOfTerm ? "Recursar fuera de término" : "Recursar"}
        </button>
      </div>
    </Modal>
  );
}

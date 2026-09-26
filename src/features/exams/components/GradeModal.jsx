import { useEffect, useState } from "react";
import Modal from "../../../shared/ui/Modal";
import { EXAM_ENROLLMENT_STATUS } from "../services/examEnrollmentService";

// Carga de nota de un alumno en una mesa. El estado se deduce de la nota
// (aprobado/desaprobado) salvo que se marque ausente.
export default function GradeModal({ open, enrollment, onClose, onSubmit }) {
  const [grade, setGrade] = useState("");
  const [absent, setAbsent] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setGrade(enrollment?.finalGrade ?? "");
      setAbsent(enrollment?.status === EXAM_ENROLLMENT_STATUS.ABSENT);
      setError("");
    }
  }, [open, enrollment]);

  if (!open) return null;

  async function handleSubmit() {
    setError("");

    if (absent) {
      await save({ finalGrade: null, status: EXAM_ENROLLMENT_STATUS.ABSENT });
      return;
    }

    const numericGrade = Number(grade);
    if (grade === "" || Number.isNaN(numericGrade) || numericGrade < 1 || numericGrade > 10) {
      setError("La nota tiene que ser un número entre 1 y 10.");
      return;
    }

    await save({
      finalGrade: numericGrade,
      status: EXAM_ENROLLMENT_STATUS.PRESENT,
    });
  }

  async function save(data) {
    setSaving(true);
    try {
      await onSubmit(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="Cargar nota" onClose={onClose}>
      <p className="users-confirm-text">
        {enrollment?.studentFirstName} {enrollment?.studentLastName} — legajo {enrollment?.enrollmentNumber}
      </p>

      {error && <p className="users-form-error">{error}</p>}

      <div className="users-form-field">
        <label className="users-form-label" htmlFor="acta-grade">
          Nota
        </label>
        <input
          id="acta-grade"
          type="number"
          min="1"
          max="10"
          step="1"
          className="users-form-input"
          value={grade}
          disabled={absent}
          onChange={(e) => setGrade(e.target.value)}
        />
      </div>

      <div className="users-form-field">
        <label className="users-form-label">
          <input type="checkbox" checked={absent} onChange={(e) => setAbsent(e.target.checked)} /> Estuvo ausente
        </label>
      </div>

      <div className="users-form-actions">
        <button type="button" className="users-btn users-btn--ghost" onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className="users-btn users-btn--primary" disabled={saving} onClick={handleSubmit}>
          Guardar nota
        </button>
      </div>
    </Modal>
  );
}

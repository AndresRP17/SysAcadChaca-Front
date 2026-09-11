import { useEffect, useState } from "react";
import Modal from "../../../shared/ui/Modal";
import { getErrorMessage } from "../../../shared/api/api";

export default function PrerequisiteFormModal({ open, courseOptions, onClose, onSubmit }) {
  const [requiredCourseId, setRequiredCourseId] = useState("");
  const [conditionType, setConditionType] = useState("CURSADA");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setRequiredCourseId(courseOptions[0]?.id ?? "");
      setConditionType("CURSADA");
      setError("");
    }
  }, [open, courseOptions]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!requiredCourseId) {
      setError("Elegí una materia requerida.");
      return;
    }
    try {
      await onSubmit({ required_course_id: Number(requiredCourseId), condition_type: conditionType });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <Modal open={open} title="Agregar correlativa" onClose={onClose}>
      <form onSubmit={handleSubmit} className="users-form">
        <div className="users-form-field">
          <label className="users-form-label">Materia requerida</label>
          <select
            value={requiredCourseId}
            onChange={(e) => setRequiredCourseId(e.target.value)}
            className="users-form-input"
          >
            {courseOptions.length === 0 && <option value="">No hay otras materias disponibles</option>}
            {courseOptions.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.name}
              </option>
            ))}
          </select>
        </div>

        <div className="users-form-field">
          <label className="users-form-label">Condición</label>
          <select
            value={conditionType}
            onChange={(e) => setConditionType(e.target.value)}
            className="users-form-input"
          >
            <option value="CURSADA">Cursada (regularizada)</option>
            <option value="APROBADA">Aprobada (final rendido)</option>
          </select>
        </div>

        {error && <p className="users-form-error">{error}</p>}

        <div className="users-form-actions">
          <button type="button" className="users-btn users-btn--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="users-btn users-btn--primary">
            Agregar
          </button>
        </div>
      </form>
    </Modal>
  );
}

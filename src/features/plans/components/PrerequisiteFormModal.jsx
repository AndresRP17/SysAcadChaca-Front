import { useEffect, useState } from "react";
import Modal from "../../../shared/ui/Modal";
import FieldError from "../../../shared/ui/FieldError";
import { getErrorMessage, getFieldErrors } from "../../../shared/api/api";

export default function PrerequisiteFormModal({ open, mode = "create", initialData, courseOptions, onClose, onSubmit }) {
  const [requiredCourseId, setRequiredCourseId] = useState("");
  const [conditionType, setConditionType] = useState("CURSADA");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (open) {
      setRequiredCourseId(initialData ? String(initialData.requiredCourseId) : "");
      setConditionType(initialData ? initialData.conditionType : "CURSADA");
      setError("");
      setFieldErrors({});
    }
  }, [open, courseOptions, initialData]);

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
      setFieldErrors(getFieldErrors(err));
    }
  }

  const title = mode === "edit" ? "Editar correlativa" : "Agregar correlativa";

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="users-form" noValidate>
        <div className="users-form-field">
          <label className="users-form-label">Materia requerida</label>
          <select
            value={requiredCourseId}
            onChange={(e) => setRequiredCourseId(e.target.value)}
            className="users-form-input"
          >
            {courseOptions.length === 0
              ? <option value="">No hay otras materias disponibles</option>
              : <option value="">Seleccioná una materia...</option>}
            {courseOptions.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.name} ({course.yearNumber}° año, {course.term}° cuat.)
              </option>
            ))}
          </select>
          <FieldError errors={fieldErrors} field="required_course_id" />
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
          <FieldError errors={fieldErrors} field="condition_type" />
        </div>

        {error && <p className="users-form-error">{error}</p>}

        <div className="users-form-actions">
          <button type="button" className="users-btn users-btn--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="users-btn users-btn--primary">
            {mode === "edit" ? "Guardar" : "Agregar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

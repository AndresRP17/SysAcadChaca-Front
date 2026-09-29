import { useEffect, useState } from "react";
import Modal from "../../../shared/ui/Modal";
import FieldError from "../../../shared/ui/FieldError";
import { getErrorMessage, getFieldErrors } from "../../../shared/api/api";

const SHIFTS = ["Mañana", "Tarde", "Noche"];
const EMPTY_FORM = { curriculum_course_id: "", teacher_id: "", name: "", academic_year: "", term: "", max_capacity: "", shift: SHIFTS[0] };

export default function SectionFormModal({ open, mode, initialData, curriculumCourseOptions, teacherOptions, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(
        initialData
          ? {
              curriculum_course_id: String(initialData.curriculumCourseId),
              teacher_id: String(initialData.teacherId),
              name: initialData.name,
              academic_year: initialData.academicYear,
              term: String(initialData.term),
              max_capacity: initialData.maxCapacity,
              shift: initialData.shift,
            }
          : EMPTY_FORM,
      );
      setError("");
      setFieldErrors({});
    }
  }, [open, initialData, curriculumCourseOptions, teacherOptions]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.curriculum_course_id || !form.teacher_id || !form.name.trim() || !form.academic_year || !form.term || !form.max_capacity) {
      setError("Completá todos los campos.");
      return;
    }
    try {
      await onSubmit({
        curriculum_course_id: Number(form.curriculum_course_id),
        teacher_id: Number(form.teacher_id),
        name: form.name,
        academic_year: Number(form.academic_year),
        term: Number(form.term),
        max_capacity: Number(form.max_capacity),
        shift: form.shift,
      });
    } catch (err) {
      setError(getErrorMessage(err));
      setFieldErrors(getFieldErrors(err));
    }
  }

  const title = mode === "edit" ? "Editar comisión" : "Nueva comisión";

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="users-form">
        <div className="users-form-field">
          <label className="users-form-label">Materia</label>
          <select
            value={form.curriculum_course_id}
            onChange={(e) => handleChange("curriculum_course_id", e.target.value)}
            className="users-form-input"
          >
            {curriculumCourseOptions.length === 0
              ? <option value="">No hay materias en este plan</option>
              : <option value="">Seleccioná una materia...</option>}
            {curriculumCourseOptions.map((cc) => (
              <option key={cc.id} value={cc.id}>{cc.code} - {cc.name}</option>
            ))}
          </select>
          <FieldError errors={fieldErrors} field="curriculum_course_id" />
        </div>

        <div className="users-form-field">
          <label className="users-form-label">Docente</label>
          <select
            value={form.teacher_id}
            onChange={(e) => handleChange("teacher_id", e.target.value)}
            className="users-form-input"
          >
            {teacherOptions.length === 0
              ? <option value="">No hay docentes cargados</option>
              : <option value="">Seleccioná un docente...</option>}
            {teacherOptions.map((t) => (
              <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
            ))}
          </select>
          <FieldError errors={fieldErrors} field="teacher_id" />
        </div>

        <div className="users-form-field">
          <label className="users-form-label">Nombre de la comisión</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Comisión A"
            className="users-form-input"
          />
          <FieldError errors={fieldErrors} field="name" />
        </div>

        <div className="users-form-row">
          <div className="users-form-field">
            <label className="users-form-label">Año lectivo</label>
            <input
              type="number"
              min="2000"
              value={form.academic_year}
              onChange={(e) => handleChange("academic_year", e.target.value)}
              className="users-form-input"
            />
            <FieldError errors={fieldErrors} field="academic_year" />
          </div>
          <div className="users-form-field">
            <label className="users-form-label">Cuatrimestre</label>
            <select
              value={form.term}
              onChange={(e) => handleChange("term", e.target.value)}
              className="users-form-input"
            >
              <option value="">Seleccioná...</option>
              <option value="1">1°</option>
              <option value="2">2°</option>
            </select>
            <FieldError errors={fieldErrors} field="term" />
          </div>
          <div className="users-form-field">
            <label className="users-form-label">Cupo máximo</label>
            <input
              type="number"
              min="1"
              value={form.max_capacity}
              onChange={(e) => handleChange("max_capacity", e.target.value)}
              className="users-form-input"
            />
            <FieldError errors={fieldErrors} field="max_capacity" />
          </div>
          <div className="users-form-field">
            <label className="users-form-label">Turno</label>
            <select
              value={form.shift}
              onChange={(e) => handleChange("shift", e.target.value)}
              className="users-form-input"
            >
              {SHIFTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <FieldError errors={fieldErrors} field="shift" />
          </div>
        </div>

        {error && <p className="users-form-error">{error}</p>}

        <div className="users-form-actions">
          <button type="button" className="users-btn users-btn--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="users-btn users-btn--primary">
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
}

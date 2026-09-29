import { useEffect, useState } from "react";
import Modal from "../../../shared/ui/Modal";
import FieldError from "../../../shared/ui/FieldError";
import { getErrorMessage, getFieldErrors } from "../../../shared/api/api";

const EMPTY_FORM = { course_id: "", year_number: "", term: "1" };

export default function AssignCourseModal({ open, courses, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setError("");
      setFieldErrors({});
      setQuery("");
    }
  }, [open, courses]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const filteredCourses = courses.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
  });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.course_id || !form.year_number) {
      setError("Completá todos los campos.");
      return;
    }
    try {
      await onSubmit({
        course_id: Number(form.course_id),
        year_number: Number(form.year_number),
        term: Number(form.term),
      });
    } catch (err) {
      setError(getErrorMessage(err));
      setFieldErrors(getFieldErrors(err));
    }
  }

  return (
    <Modal open={open} title="Asignar materia al plan" onClose={onClose}>
      <form onSubmit={handleSubmit} className="users-form">
        <div className="users-form-field">
          <label className="users-form-label">Buscar materia</label>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nombre o código..."
            className="users-form-input"
          />
        </div>

        <div className="users-form-field">
          <label className="users-form-label">Materia</label>
          <select
            value={form.course_id}
            onChange={(e) => handleChange("course_id", e.target.value)}
            className="users-form-input"
          >
            {filteredCourses.length === 0
              ? <option value="">No hay materias disponibles</option>
              : <option value="">Seleccioná una materia...</option>}
            {filteredCourses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.name}
              </option>
            ))}
          </select>
          <FieldError errors={fieldErrors} field="course_id" />
        </div>

        <div className="users-form-row">
          <div className="users-form-field">
            <label className="users-form-label">Año de la carrera</label>
            <input
              type="number"
              min="1"
              value={form.year_number}
              onChange={(e) => handleChange("year_number", e.target.value)}
              className="users-form-input"
            />
            <FieldError errors={fieldErrors} field="year_number" />
          </div>
          <div className="users-form-field">
            <label className="users-form-label">Cuatrimestre</label>
            <select
              value={form.term}
              onChange={(e) => handleChange("term", e.target.value)}
              className="users-form-input"
            >
              <option value="1">1°</option>
              <option value="2">2°</option>
            </select>
            <FieldError errors={fieldErrors} field="term" />
          </div>
        </div>

        {error && <p className="users-form-error">{error}</p>}

        <div className="users-form-actions">
          <button type="button" className="users-btn users-btn--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="users-btn users-btn--primary">
            Asignar
          </button>
        </div>
      </form>
    </Modal>
  );
}

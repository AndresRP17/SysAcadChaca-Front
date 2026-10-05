import { useEffect, useState } from "react";
import Modal from "../../../shared/ui/Modal";
import FieldError from "../../../shared/ui/FieldError";
import Combobox from "../../../shared/ui/Combobox";
import { getErrorMessage, getFieldErrors } from "../../../shared/api/api";

const EMPTY_FORM = { course_id: "", year_number: "", term: "1", credit_hours: "" };

export default function AssignCourseModal({ open, courses, durationYears, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setError("");
      setFieldErrors({});
    }
  }, [open, courses]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const courseOptions = courses.map((c) => ({
    value: c.id,
    label: `${c.code} - ${c.name}`,
    searchText: `${c.code} ${c.name}`,
  }));

  const yearOptions = Array.from({ length: durationYears || 1 }, (_, i) => i + 1);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.course_id || !form.year_number || !form.credit_hours) {
      setError("Completá todos los campos.");
      return;
    }
    try {
      await onSubmit({
        course_id: Number(form.course_id),
        year_number: Number(form.year_number),
        term: Number(form.term),
        credit_hours: Number(form.credit_hours),
      });
    } catch (err) {
      setError(getErrorMessage(err));
      setFieldErrors(getFieldErrors(err));
    }
  }

  return (
    <Modal open={open} title="Asignar materia al plan" onClose={onClose}>
      <form onSubmit={handleSubmit} className="users-form" noValidate>
        <div className="users-form-field">
          <label className="users-form-label">Materia</label>
          <Combobox
            options={courseOptions}
            value={form.course_id}
            onChange={(v) => handleChange("course_id", v)}
            placeholder="Buscar por nombre o código..."
            emptyLabel="No hay materias disponibles"
          />
          <FieldError errors={fieldErrors} field="course_id" />
        </div>

        <div className="users-form-row">
          <div className="users-form-field">
            <label className="users-form-label">Año de cursada</label>
            <select
              value={form.year_number}
              onChange={(e) => handleChange("year_number", e.target.value)}
              className="users-form-input"
            >
              <option value="">Seleccioná el año...</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}° año
                </option>
              ))}
            </select>
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

        <div className="users-form-field">
          <label className="users-form-label">Carga horaria total (según plan de estudios)</label>
          <input
            type="number"
            min="1"
            max="400"
            value={form.credit_hours}
            onChange={(e) => handleChange("credit_hours", e.target.value)}
            className="users-form-input"
          />
          <FieldError errors={fieldErrors} field="credit_hours" />
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

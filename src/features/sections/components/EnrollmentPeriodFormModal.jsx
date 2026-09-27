import { useEffect, useState } from "react";
import Modal from "../../../shared/ui/Modal";
import { getErrorMessage } from "../../../shared/api/api";
import { PERIOD_TYPES } from "../services/enrollmentPeriodService";

const EMPTY_FORM = { type: "CURSADA", academic_year: "", term: "", start_date: "", end_date: "", active: true };

export default function EnrollmentPeriodFormModal({ open, mode, initialData, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      initialData
        ? {
            type: initialData.type,
            academic_year: String(initialData.academicYear),
            term: initialData.term ? String(initialData.term) : "",
            start_date: initialData.startDate,
            end_date: initialData.endDate,
            active: initialData.active,
          }
        : { ...EMPTY_FORM, academic_year: String(new Date().getFullYear()) },
    );
    setError("");
  }, [open, initialData]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.academic_year || !form.start_date || !form.end_date) {
      setError("Completá el año lectivo y las fechas de inicio y fin.");
      return;
    }
    if (form.type === "CURSADA" && !form.term) {
      setError("El cuatrimestre es obligatorio para los períodos de cursada.");
      return;
    }
    if (form.end_date < form.start_date) {
      setError("La fecha de fin no puede ser anterior a la de inicio.");
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        type: form.type,
        academic_year: Number(form.academic_year),
        term: form.term ? Number(form.term) : null,
        start_date: form.start_date,
        end_date: form.end_date,
        active: form.active ? 1 : 0,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const title = mode === "edit" ? "Editar período de inscripción" : "Nuevo período de inscripción";

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="users-form">
        <div className="users-form-row">
          <div className="users-form-field">
            <label className="users-form-label" htmlFor="ep-type">Tipo</label>
            <select
              id="ep-type"
              value={form.type}
              onChange={(e) => handleChange("type", e.target.value)}
              className="users-form-input"
            >
              {Object.entries(PERIOD_TYPES).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="users-form-field">
            <label className="users-form-label" htmlFor="ep-year">Año lectivo</label>
            <input
              id="ep-year"
              type="number"
              min="2000"
              value={form.academic_year}
              onChange={(e) => handleChange("academic_year", e.target.value)}
              className="users-form-input"
            />
          </div>
          <div className="users-form-field">
            <label className="users-form-label" htmlFor="ep-term">Cuatrimestre</label>
            <select
              id="ep-term"
              value={form.term}
              onChange={(e) => handleChange("term", e.target.value)}
              className="users-form-input"
            >
              <option value="">{form.type === "CURSADA" ? "Seleccioná..." : "Todos"}</option>
              <option value="1">1°</option>
              <option value="2">2°</option>
            </select>
          </div>
        </div>

        <div className="users-form-row">
          <div className="users-form-field">
            <label className="users-form-label" htmlFor="ep-start">Inicio</label>
            <input
              id="ep-start"
              type="date"
              value={form.start_date}
              onChange={(e) => handleChange("start_date", e.target.value)}
              className="users-form-input"
            />
          </div>
          <div className="users-form-field">
            <label className="users-form-label" htmlFor="ep-end">Fin</label>
            <input
              id="ep-end"
              type="date"
              value={form.end_date}
              onChange={(e) => handleChange("end_date", e.target.value)}
              className="users-form-input"
            />
          </div>
        </div>

        <label className="users-form-label">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => handleChange("active", e.target.checked)}
          />{" "}
          Período activo
        </label>

        {error && <p className="users-form-error">{error}</p>}

        <div className="users-form-actions">
          <button type="button" className="users-btn users-btn--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="users-btn users-btn--primary" disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

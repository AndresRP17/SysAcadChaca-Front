import { useEffect, useState } from "react";
import Modal from "../../../shared/ui/Modal";
import FieldError from "../../../shared/ui/FieldError";
import { getErrorMessage, getFieldErrors } from "../../../shared/api/api";

const EMPTY_FORM = { name: "", code: "", duration_years: "" };

export default function ProgramFormModal({ open, mode, initialData, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(
        initialData
          ? { name: initialData.name, code: initialData.code, duration_years: initialData.durationYears }
          : EMPTY_FORM,
      );
      setError("");
      setFieldErrors({});
    }
  }, [open, initialData]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim() || !form.duration_years) {
      setError("Completá todos los campos.");
      return;
    }
    try {
      await onSubmit({ ...form, duration_years: Number(form.duration_years) });
    } catch (err) {
      setError(getErrorMessage(err));
      setFieldErrors(getFieldErrors(err));
    }
  }

  const title = mode === "edit" ? "Editar carrera" : "Nueva carrera";

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="users-form" noValidate>
        <div className="users-form-field">
          <label className="users-form-label">Nombre</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="users-form-input"
          />
          <FieldError errors={fieldErrors} field="name" />
        </div>

        <div className="users-form-row">
          <div className="users-form-field">
            <label className="users-form-label">Código</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => handleChange("code", e.target.value)}
              className="users-form-input"
            />
            <FieldError errors={fieldErrors} field="code" />
          </div>
          <div className="users-form-field">
            <label className="users-form-label">Duración (años)</label>
            <select
              value={form.duration_years}
              onChange={(e) => handleChange("duration_years", e.target.value)}
              className="users-form-input"
            >
              <option value="">Seleccioná...</option>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <FieldError errors={fieldErrors} field="duration_years" />
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

import { useEffect, useState } from "react";
import Modal from "../../../shared/ui/Modal";
import FieldError from "../../../shared/ui/FieldError";
import { getErrorMessage, getFieldErrors } from "../../../shared/api/api";

const EMPTY_FORM = { name: "", code: "", credit_hours: "" };

export default function CourseFormModal({ open, mode, initialData, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(
        initialData
          ? { name: initialData.name, code: initialData.code, credit_hours: initialData.creditHours }
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
    if (!form.name.trim() || !form.code.trim() || !form.credit_hours) {
      setError("Completá todos los campos.");
      return;
    }
    try {
      await onSubmit({ ...form, credit_hours: Number(form.credit_hours) });
    } catch (err) {
      setError(getErrorMessage(err));
      setFieldErrors(getFieldErrors(err));
    }
  }

  const title = mode === "edit" ? "Editar materia" : "Nueva materia";

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="users-form">
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
            <label className="users-form-label">Carga horaria</label>
            <input
              type="number"
              min="1"
              value={form.credit_hours}
              onChange={(e) => handleChange("credit_hours", e.target.value)}
              className="users-form-input"
            />
            <FieldError errors={fieldErrors} field="credit_hours" />
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

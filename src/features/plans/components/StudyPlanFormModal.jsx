import { useEffect, useState } from "react";
import Modal from "../../../shared/ui/Modal";
import FieldError from "../../../shared/ui/FieldError";
import { getErrorMessage, getFieldErrors } from "../../../shared/api/api";

const EMPTY_FORM = { resolution_year: "", active: true };

export default function StudyPlanFormModal({ open, mode = "create", initialData, programId, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(
        initialData
          ? { resolution_year: initialData.resolutionYear, active: initialData.active }
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
    if (!form.resolution_year) {
      setError("Completá el año de resolución.");
      return;
    }
    try {
      await onSubmit({
        program_id: programId,
        resolution_year: Number(form.resolution_year),
        active: form.active,
      });
    } catch (err) {
      setError(getErrorMessage(err));
      setFieldErrors(getFieldErrors(err));
    }
  }

  const title = mode === "edit" ? "Editar plan de estudio" : "Nuevo plan de estudio";

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="users-form" noValidate>
        <div className="users-form-field">
          <label className="users-form-label">Año de resolución</label>
          <input
            type="number"
            min="1990"
            value={form.resolution_year}
            onChange={(e) => handleChange("resolution_year", e.target.value)}
            className="users-form-input"
          />
          <FieldError errors={fieldErrors} field="resolution_year" />
        </div>

        <div className="users-form-field">
          <label className="users-form-label">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => handleChange("active", e.target.checked)}
            />{" "}
            Activo
          </label>
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

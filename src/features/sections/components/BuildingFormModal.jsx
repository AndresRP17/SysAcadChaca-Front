import { useEffect, useState } from "react";
import Modal from "../../../shared/ui/Modal/Modal";
import FieldError from "../../../shared/ui/FieldError";
import { getErrorMessage, getFieldErrors } from "../../../shared/api/api";
import { useSubmitLock } from "../../../shared/hooks/useSubmitLock";

const EMPTY_FORM = { name: "", address: "" };

export default function BuildingFormModal({ open, mode, initialData, onClose, onSubmit }) {
  const { lock, pending } = useSubmitLock();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(
        initialData
          ? { name: initialData.name, address: initialData.address }
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
    if (!form.name.trim() || !form.address.trim()) {
      setError("Completá todos los campos.");
      return;
    }
    try {
      await onSubmit(form);
    } catch (err) {
      setError(getErrorMessage(err));
      setFieldErrors(getFieldErrors(err));
    }
  }

  const title = mode === "edit" ? "Editar edificio" : "Nuevo edificio";

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form onSubmit={lock(handleSubmit)} className="users-form" noValidate>
        <div className="users-form-field">
          <label className="users-form-label" htmlFor="buildingFormModal-1">Nombre</label>
          <input id="buildingFormModal-1"
            type="text"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="users-form-input"
          />
          <FieldError errors={fieldErrors} field="name" />
        </div>

        <div className="users-form-field">
          <label className="users-form-label" htmlFor="buildingFormModal-2">Dirección</label>
          <input id="buildingFormModal-2"
            type="text"
            value={form.address}
            onChange={(e) => handleChange("address", e.target.value)}
            className="users-form-input"
          />
          <FieldError errors={fieldErrors} field="address" />
        </div>

        {error && <p className="users-form-error">{error}</p>}

        <div className="users-form-actions">
          <button type="button" className="users-btn users-btn--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="users-btn users-btn--primary" disabled={pending} aria-busy={pending}>
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
}

import { useEffect, useState } from "react";
import Modal from "../../../shared/ui/Modal";
import { getErrorMessage } from "../../../shared/api/api";
import { useBuildings } from "../hooks/useBuildings";

const EMPTY_FORM = { name: "", capacity: "", location: "", buildingId: "" };

export default function ClassroomFormModal({ open, mode, initialData, onClose, onSubmit }) {
  const { buildings } = useBuildings();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(
        initialData
          ? {
              name: initialData.name,
              capacity: initialData.capacity,
              location: initialData.location,
              buildingId: initialData.buildingId ?? "",
            }
          : EMPTY_FORM,
      );
      setError("");
    }
  }, [open, initialData]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.capacity || !form.location.trim() || !form.buildingId) {
      setError("Completá todos los campos.");
      return;
    }
    try {
      await onSubmit({ ...form, capacity: Number(form.capacity), buildingId: Number(form.buildingId) });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const title = mode === "edit" ? "Editar aula" : "Nueva aula";

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
        </div>

        <div className="users-form-field">
          <label className="users-form-label">Edificio</label>
          <select
            value={form.buildingId}
            onChange={(e) => handleChange("buildingId", e.target.value)}
            className="users-form-input"
          >
            <option value="">Seleccioná un edificio</option>
            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.name}
              </option>
            ))}
          </select>
        </div>

        <div className="users-form-row">
          <div className="users-form-field">
            <label className="users-form-label">Capacidad</label>
            <input
              type="number"
              min="1"
              value={form.capacity}
              onChange={(e) => handleChange("capacity", e.target.value)}
              className="users-form-input"
            />
          </div>
          <div className="users-form-field">
            <label className="users-form-label">Ubicación (ej. Planta baja, Ala norte)</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => handleChange("location", e.target.value)}
              className="users-form-input"
            />
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

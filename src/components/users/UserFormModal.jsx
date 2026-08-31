import { useEffect, useState } from "react";
import Modal from "../common/Modal";

const EMPTY_FORM = {
  legajo: "",
  nombre: "",
  apellido: "",
  email: "",
  rol: "Alumno",
  estado: "Activo",
};

export default function UserFormModal({ open, mode, initialData, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  // Cada vez que se abre el modal, carga los datos del usuario a editar
  // (o el formulario vacío si es un alta nueva).
  useEffect(() => {
    if (open) {
      setForm(initialData ?? EMPTY_FORM);
      setError("");
    }
  }, [open, initialData]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.legajo.trim() || !form.nombre.trim() || !form.apellido.trim() || !form.email.trim()) {
      setError("Completá todos los campos obligatorios.");
      return;
    }
    onSubmit(form);
  }

  const title = mode === "edit" ? "Editar usuario" : "Nuevo usuario";

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="users-form">
        <div className="users-form-field">
          <label className="users-form-label">Legajo</label>
          <input
            type="text"
            value={form.legajo}
            onChange={(e) => handleChange("legajo", e.target.value)}
            className="users-form-input"
          />
        </div>

        <div className="users-form-row">
          <div className="users-form-field">
            <label className="users-form-label">Nombre</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => handleChange("nombre", e.target.value)}
              className="users-form-input"
            />
          </div>
          <div className="users-form-field">
            <label className="users-form-label">Apellido</label>
            <input
              type="text"
              value={form.apellido}
              onChange={(e) => handleChange("apellido", e.target.value)}
              className="users-form-input"
            />
          </div>
        </div>

        <div className="users-form-field">
          <label className="users-form-label">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className="users-form-input"
          />
        </div>

        <div className="users-form-row">
          <div className="users-form-field">
            <label className="users-form-label">Rol</label>
            <select
              value={form.rol}
              onChange={(e) => handleChange("rol", e.target.value)}
              className="users-form-input"
            >
              <option value="Alumno">Alumno</option>
              <option value="Docente">Docente</option>
            </select>
          </div>
          <div className="users-form-field">
            <label className="users-form-label">Estado</label>
            <select
              value={form.estado}
              onChange={(e) => handleChange("estado", e.target.value)}
              className="users-form-input"
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
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

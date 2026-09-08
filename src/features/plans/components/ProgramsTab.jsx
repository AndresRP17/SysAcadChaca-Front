import { useState } from "react";
import { usePrograms } from "../hooks/usePrograms";
import ProgramFormModal from "./ProgramFormModal";
import ConfirmModal from "../../../shared/ui/ConfirmModal";

export default function ProgramsTab() {
  const { programs, loading, error, addProgram, editProgram, removeProgram } = usePrograms();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [editingProgram, setEditingProgram] = useState(null);
  const [programToDelete, setProgramToDelete] = useState(null);

  function openCreateModal() {
    setFormMode("create");
    setEditingProgram(null);
    setFormOpen(true);
  }

  function openEditModal(program) {
    setFormMode("edit");
    setEditingProgram(program);
    setFormOpen(true);
  }

  async function handleFormSubmit(data) {
    if (formMode === "edit" && editingProgram) {
      await editProgram(editingProgram.id, data);
    } else {
      await addProgram(data);
    }
    setFormOpen(false);
  }

  async function handleConfirmDelete() {
    await removeProgram(programToDelete.id);
    setProgramToDelete(null);
  }

  return (
    <div>
      <div className="plans-toolbar">
        <p className="users-subtitle">{programs.length} carrera{programs.length !== 1 ? "s" : ""}</p>
        <button type="button" className="users-btn users-btn--primary" onClick={openCreateModal}>
          + Nueva carrera
        </button>
      </div>

      {error && <p className="users-form-error">{error}</p>}

      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th className="users-th">Nombre</th>
              <th className="users-th">Código</th>
              <th className="users-th">Duración</th>
              <th className="users-th users-th--actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="users-empty" colSpan={4}>Cargando...</td></tr>
            )}
            {!loading && programs.length === 0 && (
              <tr><td className="users-empty" colSpan={4}>No hay carreras cargadas.</td></tr>
            )}
            {programs.map((program) => (
              <tr key={program.id} className="users-row">
                <td className="users-td" data-label="Nombre">{program.name}</td>
                <td className="users-td" data-label="Código">{program.code}</td>
                <td className="users-td" data-label="Duración">{program.durationYears} años</td>
                <td className="users-td users-td--actions" data-label="Acciones">
                  <button type="button" className="users-action-btn" onClick={() => openEditModal(program)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="users-action-btn users-action-btn--danger"
                    onClick={() => setProgramToDelete(program)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ProgramFormModal
        open={formOpen}
        mode={formMode}
        initialData={editingProgram}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <ConfirmModal
        open={!!programToDelete}
        title="Eliminar carrera"
        message={programToDelete ? `¿Seguro que querés eliminar "${programToDelete.name}"? Esta acción no se puede deshacer.` : ""}
        onCancel={() => setProgramToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

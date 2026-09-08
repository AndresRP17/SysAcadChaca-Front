import { useState } from "react";
import { useClassrooms } from "../hooks/useClassrooms";
import ClassroomFormModal from "./ClassroomFormModal";
import ConfirmModal from "../../../shared/ui/ConfirmModal";

export default function AulasTab() {
  const { classrooms, loading, error, addClassroom, editClassroom, removeClassroom } = useClassrooms();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [classroomToDelete, setClassroomToDelete] = useState(null);

  function openCreateModal() {
    setFormMode("create");
    setEditingClassroom(null);
    setFormOpen(true);
  }

  function openEditModal(classroom) {
    setFormMode("edit");
    setEditingClassroom(classroom);
    setFormOpen(true);
  }

  async function handleFormSubmit(data) {
    if (formMode === "edit" && editingClassroom) {
      await editClassroom(editingClassroom.id, data);
    } else {
      await addClassroom(data);
    }
    setFormOpen(false);
  }

  async function handleConfirmDelete() {
    await removeClassroom(classroomToDelete.id);
    setClassroomToDelete(null);
  }

  return (
    <div>
      <div className="plans-toolbar">
        <p className="users-subtitle">{classrooms.length} aula{classrooms.length !== 1 ? "s" : ""}</p>
        <button type="button" className="users-btn users-btn--primary" onClick={openCreateModal}>
          + Nueva aula
        </button>
      </div>

      {error && <p className="users-form-error">{error}</p>}

      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th className="users-th">Nombre</th>
              <th className="users-th">Capacidad</th>
              <th className="users-th">Ubicación</th>
              <th className="users-th users-th--actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="users-empty" colSpan={4}>Cargando...</td></tr>
            )}
            {!loading && classrooms.length === 0 && (
              <tr><td className="users-empty" colSpan={4}>No hay aulas cargadas.</td></tr>
            )}
            {!loading && classrooms.map((classroom) => (
              <tr key={classroom.id} className="users-row">
                <td className="users-td" data-label="Nombre">{classroom.name}</td>
                <td className="users-td" data-label="Capacidad">{classroom.capacity}</td>
                <td className="users-td" data-label="Ubicación">{classroom.location}</td>
                <td className="users-td users-td--actions" data-label="Acciones">
                  <button type="button" className="users-action-btn" onClick={() => openEditModal(classroom)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="users-action-btn users-action-btn--danger"
                    onClick={() => setClassroomToDelete(classroom)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ClassroomFormModal
        open={formOpen}
        mode={formMode}
        initialData={editingClassroom}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <ConfirmModal
        open={!!classroomToDelete}
        title="Eliminar aula"
        message={classroomToDelete ? `¿Seguro que querés eliminar "${classroomToDelete.name}"? Esta acción no se puede deshacer.` : ""}
        onCancel={() => setClassroomToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

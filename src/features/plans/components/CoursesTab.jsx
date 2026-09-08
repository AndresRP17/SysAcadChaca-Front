import { useState } from "react";
import { useCourses } from "../hooks/useCourses";
import CourseFormModal from "./CourseFormModal";
import ConfirmModal from "../../../shared/ui/ConfirmModal";

export default function CoursesTab() {
  const { courses, loading, error, addCourse, editCourse, removeCourse } = useCourses();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);

  function openCreateModal() {
    setFormMode("create");
    setEditingCourse(null);
    setFormOpen(true);
  }

  function openEditModal(course) {
    setFormMode("edit");
    setEditingCourse(course);
    setFormOpen(true);
  }

  async function handleFormSubmit(data) {
    if (formMode === "edit" && editingCourse) {
      await editCourse(editingCourse.id, data);
    } else {
      await addCourse(data);
    }
    setFormOpen(false);
  }

  async function handleConfirmDelete() {
    await removeCourse(courseToDelete.id);
    setCourseToDelete(null);
  }

  return (
    <div>
      <div className="plans-toolbar">
        <p className="users-subtitle">{courses.length} materia{courses.length !== 1 ? "s" : ""}</p>
        <button type="button" className="users-btn users-btn--primary" onClick={openCreateModal}>
          + Nueva materia
        </button>
      </div>

      {error && <p className="users-form-error">{error}</p>}

      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th className="users-th">Nombre</th>
              <th className="users-th">Código</th>
              <th className="users-th">Carga horaria</th>
              <th className="users-th users-th--actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="users-empty" colSpan={4}>Cargando...</td></tr>
            )}
            {!loading && courses.length === 0 && (
              <tr><td className="users-empty" colSpan={4}>No hay materias cargadas.</td></tr>
            )}
            {courses.map((course) => (
              <tr key={course.id} className="users-row">
                <td className="users-td" data-label="Nombre">{course.name}</td>
                <td className="users-td" data-label="Código">{course.code}</td>
                <td className="users-td" data-label="Carga horaria">{course.creditHours} hs</td>
                <td className="users-td users-td--actions" data-label="Acciones">
                  <button type="button" className="users-action-btn" onClick={() => openEditModal(course)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="users-action-btn users-action-btn--danger"
                    onClick={() => setCourseToDelete(course)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CourseFormModal
        open={formOpen}
        mode={formMode}
        initialData={editingCourse}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <ConfirmModal
        open={!!courseToDelete}
        title="Eliminar materia"
        message={courseToDelete ? `¿Seguro que querés eliminar "${courseToDelete.name}"? Esta acción no se puede deshacer.` : ""}
        onCancel={() => setCourseToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

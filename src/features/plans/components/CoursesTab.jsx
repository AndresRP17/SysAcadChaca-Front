import { useState } from "react";
import { usePagedCourses } from "../hooks/usePagedCourses";
import CourseFormModal from "./CourseFormModal";
import ConfirmModal, { DELETE_NOTE } from "../../../shared/ui/ConfirmModal";
import ListFilters from "../../../shared/ui/ListFilters";
import LoadError from "../../../shared/ui/LoadError";
import Pagination from "../../../shared/ui/Pagination";

export default function CoursesTab() {
  const list = usePagedCourses();
  const { courses, loading, error, addCourse, editCourse, removeCourse } = list;

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
        <p className="users-subtitle">{list.total} materia{list.total !== 1 ? "s" : ""}</p>
        <button type="button" className="users-btn users-btn--primary" onClick={openCreateModal}>
          + Nueva materia
        </button>
      </div>

      <ListFilters
        idPrefix="courses"
        search={list.search}
        onSearchChange={list.changeSearch}
        searchLabel="Buscar"
        searchPlaceholder="Nombre o código de la materia"
        hasFilters={list.hasFilters}
        onClear={list.clearFilters}
      />

      <LoadError message={error} onRetry={list.reload} />

      {!error && (
      <div className={"users-list" + (loading && courses.length > 0 ? " users-list--loading" : "")} aria-busy={loading}>
      <div className="users-table-wrapper">
        <table className="users-table plans-data-table">
          <thead>
            <tr>
              <th className="users-th">Nombre</th>
              <th className="users-th">Código</th>
              <th className="users-th users-th--actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && courses.length === 0 && (
              <tr><td className="users-empty" colSpan={3}>Cargando...</td></tr>
            )}
            {!loading && courses.length === 0 && (
              <tr>
                <td className="users-empty" colSpan={3}>
                  {list.hasFilters ? "No hay materias con esa búsqueda." : "No hay materias cargadas."}
                </td>
              </tr>
            )}
            {courses.map((course) => (
              <tr key={course.id} className="users-row">
                <td className="users-td" data-label="Nombre">{course.name}</td>
                <td className="users-td" data-label="Código">{course.code}</td>
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
      <Pagination
        page={list.page}
        pageSize={list.pageSize}
        total={list.total}
        onPageChange={list.setPage}
        onPageSizeChange={list.changePageSize}
        noun={["materia", "materias"]}
      />
      </div>
      )}

      <CourseFormModal
        open={formOpen}
        mode={formMode}
        initialData={editingCourse}
        existingCodes={courses.map((c) => c.code)}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <ConfirmModal
        open={!!courseToDelete}
        title="Eliminar materia"
        note={DELETE_NOTE}
        message={courseToDelete ? `¿Seguro que querés eliminar "${courseToDelete.name}"? Esta acción no se puede deshacer.` : ""}
        onCancel={() => setCourseToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

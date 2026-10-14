import { useState } from "react";
import { useToast } from "../../context/ToastContext";
import { getErrorMessage } from "../../shared/api/api";
import ListFilters from "../../shared/ui/ListFilters";
import LoadError from "../../shared/ui/LoadError";
import Pagination from "../../shared/ui/Pagination";
import { useUsers } from "./hooks/useUsers";
import UserTable from "./components/UserTable";
import UserFormModal from "./components/UserFormModal";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal";
import "./usersPage.css";

const STATUS_OPTIONS = [
  { value: "1", label: "Activo" },
  { value: "0", label: "Inactivo" },
];

export default function UsersPage({ studentsOnly = false }) {
  const {
    users,
    total,
    page,
    setPage,
    pageSize,
    changePageSize,
    loading,
    error,
    reload,
    filters,
    changeFilter,
    clearFilters,
    hasFilters,
    roleOptions,
    programOptions,
    resolveTeacher,
    addUser,
    updateUser,
    deleteUser,
  } = useUsers({ studentsOnly });
  const noun = studentsOnly ? "alumno" : "usuario";
  const { showToast } = useToast();

  // Estado del modal de alta/edición
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create"); // "create" | "edit"
  const [editingUser, setEditingUser] = useState(null);

  // Estado del modal de confirmación de borrado
  const [userToDelete, setUserToDelete] = useState(null);

  function openCreateModal() {
    setFormMode("create");
    setEditingUser(null);
    setFormOpen(true);
  }

  async function openEditModal(user) {
    try {
      // El docente trae legajo y título de su perfil: se piden recién al editar.
      setEditingUser(await resolveTeacher(user));
    } catch (e) {
      showToast(getErrorMessage(e, "No se pudo abrir la edición."), "error");
      return;
    }
    setFormMode("edit");
    setFormOpen(true);
  }

  async function handleFormSubmit(data) {
    if (formMode === "edit" && editingUser) {
      await updateUser(editingUser, data);
      showToast(`${data.rol} actualizado correctamente`);
    } else {
      await addUser(data);
      showToast(`${data.rol} creado correctamente`);
    }
    setFormOpen(false);
  }

  async function handleConfirmDelete(user) {
    await deleteUser(user);
    setUserToDelete(null);
    showToast(`${user.rol} eliminado correctamente`);
  }

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1 className="users-title">{studentsOnly ? "Alumnos" : "Usuarios"}</h1>
          <p className="users-subtitle">
            {studentsOnly ? "Gestioná los alumnos y filtrá por carrera o estado" : "Administradores, docentes y bedeles (los alumnos están en la vista Alumnos)"}
          </p>
        </div>
        <div className="users-header-actions">
          <button type="button" className="users-btn users-btn--primary" onClick={openCreateModal}>
            + Nuevo {noun}
          </button>
        </div>
      </div>

      <ListFilters
        idPrefix={studentsOnly ? "students" : "users"}
        search={filters.search}
        onSearchChange={(value) => changeFilter("search", value)}
        searchLabel="Buscar"
        searchPlaceholder={studentsOnly ? "Nombre, legajo o DNI" : "Nombre, email o DNI"}
        selects={[
          studentsOnly
            ? {
                id: "program",
                label: "Carrera",
                value: filters.program,
                onChange: (value) => changeFilter("program", value),
                options: programOptions,
                allLabel: "Todas",
              }
            : {
                id: "role",
                label: "Rol",
                value: filters.role,
                onChange: (value) => changeFilter("role", value),
                options: roleOptions,
                allLabel: "Todos",
              },
          {
            id: "active",
            label: "Estado",
            value: filters.active,
            onChange: (value) => changeFilter("active", value),
            options: STATUS_OPTIONS,
            allLabel: "Todos",
          },
        ]}
        hasFilters={hasFilters}
        onClear={clearFilters}
      />

      <LoadError message={error} onRetry={reload} />

      {loading && users.length === 0 && !error && <p className="users-empty">Cargando...</p>}

      {!error && !(loading && users.length === 0) && (
        users.length === 0 ? (
          <p className="users-empty">
            {hasFilters ? `No hay ${studentsOnly ? "alumnos" : "usuarios"} con esos filtros` : `Todavía no hay ${studentsOnly ? "alumnos" : "usuarios"}`}
          </p>
        ) : (
          <div className={"users-list" + (loading ? " users-list--loading" : "")} aria-busy={loading}>
            <div className="users-table-wrapper">
              <UserTable users={users} onEdit={openEditModal} onDelete={setUserToDelete} studentsOnly={studentsOnly} />
            </div>
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={changePageSize}
              noun={studentsOnly ? ["alumno", "alumnos"] : ["usuario", "usuarios"]}
            />
          </div>
        )
      )}

      <UserFormModal
        open={formOpen}
        mode={formMode}
        initialData={editingUser}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        studentsOnly={studentsOnly}
      />

      <ConfirmDeleteModal
        open={!!userToDelete}
        user={userToDelete}
        onCancel={() => setUserToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

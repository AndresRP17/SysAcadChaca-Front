import { useState } from "react";
import { useToast } from "../../context/ToastContext";
import { useUsers } from "./hooks/useUsers";
import SearchBar from "./components/SearchBar";
import FilterBar from "./components/FilterBar";
import UserTable from "./components/UserTable";
import UserFormModal from "./components/UserFormModal";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal";
import "./usersPage.css";

export default function UsersPage({ studentsOnly = false }) {
  const {
    users,
    totalCount,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
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

  function openEditModal(user) {
    setFormMode("edit");
    setEditingUser(user);
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
            {totalCount} {noun}{totalCount !== 1 ? "s" : ""} registrado{totalCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="users-header-actions">
          <button type="button" className="users-btn users-btn--primary" onClick={openCreateModal}>
            + Nuevo {noun}
          </button>
        </div>
      </div>

      <div className="users-toolbar">
        <SearchBar value={searchTerm} onChange={setSearchTerm} />
        {!studentsOnly && <FilterBar value={roleFilter} onChange={setRoleFilter} />}
      </div>

      {error && <p className="users-form-error">{error}</p>}
      {loading && <p className="users-empty">Cargando...</p>}

      {!loading && (
        <div className="users-table-wrapper">
          <UserTable users={users} onEdit={openEditModal} onDelete={setUserToDelete} />
        </div>
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

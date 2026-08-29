import { useState } from "react";
import { useUsers } from "../../hooks/useUsers";
import SearchBar from "./SearchBar";
import FilterBar from "./FilterBar";
import UserTable from "./UserTable";
import UserFormModal from "./UserFormModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import ThemeToggle from "../common/ThemeToggle";
import "./Users.css";

export default function UsersPage() {
  const {
    users,
    totalCount,
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    addUser,
    updateUser,
    deleteUser,
  } = useUsers();

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

  function handleFormSubmit(data) {
    if (formMode === "edit" && editingUser) {
      updateUser(editingUser.id, data);
    } else {
      addUser(data);
    }
    setFormOpen(false);
  }

  function handleConfirmDelete(user) {
    deleteUser(user.id);
    setUserToDelete(null);
  }

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1 className="users-title">Usuarios</h1>
          <p className="users-subtitle">
            {totalCount} usuario{totalCount !== 1 ? "s" : ""} registrado{totalCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="users-header-actions">
          <button type="button" className="users-btn users-btn--primary" onClick={openCreateModal}>
            + Nuevo usuario
          </button>
        </div>
      </div>

      <div className="users-toolbar">
        <SearchBar value={searchTerm} onChange={setSearchTerm} />
        <FilterBar value={roleFilter} onChange={setRoleFilter} />
      </div>

      <div className="users-table-wrapper">
        <UserTable users={users} onEdit={openEditModal} onDelete={setUserToDelete} />
      </div>

      <UserFormModal
        open={formOpen}
        mode={formMode}
        initialData={editingUser}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
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

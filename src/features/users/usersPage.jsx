<<<<<<< HEAD
import { useState } from "react";
import { useUsers } from "./hooks/useUsers";
import SearchBar from "./components/SearchBar";
import FilterBar from "./components/FilterBar";
import UserTable from "./components/UserTable";
import UserFormModal from "./components/UserFormModal";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal";
import "./usersPage.css";

export default function UsersPage() {
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

  async function handleFormSubmit(data) {
    if (formMode === "edit" && editingUser) {
      await updateUser(editingUser, data);
    } else {
      await addUser(data);
    }
    setFormOpen(false);
  }

  async function handleConfirmDelete(user) {
    await deleteUser(user);
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
=======
import { useState } from 'react';
import { Plus, Search, UserPlus, Edit, Trash2, UserX, UserCheck } from 'lucide-react';
import useUsersPage from './hooks/usersPage';
import { Table } from '../../shared/ui/table/Table';
import './usersPage.css';



export default function Users() {


  const {
    users,
    page,
    totalPages,
    handlePageChange,

    updateFilters,
    handleSearch,

    crud,

    refresh,
    columns,
    actions
  } = useUsersPage();


  return (
    <div className="page-container users-page">
     
  
      <Table columns={columns} data={users} actions={actions} />




             
    </div>
  );
}
>>>>>>> origin/develop

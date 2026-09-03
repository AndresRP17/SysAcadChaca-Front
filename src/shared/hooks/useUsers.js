import { useMemo, useState } from "react";
import { mockUsers, nextId } from "../../data/mockUsers";

export function useUsers() {
  const [users, setUsers] = useState(mockUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("Todos");

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole = roleFilter === "Todos" || user.rol === roleFilter;

      const matchesSearch =
        term === "" ||
        user.nombre.toLowerCase().includes(term) ||
        user.apellido.toLowerCase().includes(term) ||
        user.legajo.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term);

      return matchesRole && matchesSearch;
    });
  }, [users, searchTerm, roleFilter]);

  function addUser(data) {
    setUsers((prev) => [...prev, { id: nextId(), ...data }]);
  }

  function updateUser(id, data) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } : u)));
  }

  function deleteUser(id) {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  return {
    users: filteredUsers,
    totalCount: users.length,
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    addUser,
    updateUser,
    deleteUser,
  };
}

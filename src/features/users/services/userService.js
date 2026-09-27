import { api } from "../../../shared/api/api";

// Usuarios sin tabla de perfil propia (hoy, Bedel): son un registro de
// /users a secas, sin legajo ni datos extra como alumno/docente.
export async function getUsersByRole(roleId) {
  const { data } = await api.get(`/users?role_id=${roleId}&size=1000`);
  return data;
}

export async function createUser(data) {
  const res = await api.post("/users", data);
  return res.data;
}

export async function updateUser(id, data) {
  const res = await api.put(`/users/${id}`, data);
  return res.data;
}

export async function deleteUser(id) {
  await api.delete(`/users/${id}`);
}

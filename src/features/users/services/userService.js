import { api } from "../../../shared/api/api";
import { cleanParams, toPage } from "./pagedList";

// Usuarios sin tabla de perfil propia (hoy, Bedel): son un registro de
// /users a secas, sin legajo ni datos extra como alumno/docente.
export async function getUsersByRole(roleId) {
  const { data } = await api.get(`/users?role_id=${roleId}&size=1000`);
  return data;
}

// Una página de usuarios filtrada en el servidor: { items, total }.
// excludeRole: nombre de un rol a dejar fuera (la pantalla Usuarios no lista alumnos).
export async function getUsersPage({ q, roleId, active, excludeRole, page = 1, size = 10 } = {}) {
  const response = await api.get("/users", {
    params: cleanParams({ q, role_id: roleId, active, exclude_role: excludeRole, page, size }),
  });
  return toPage(response);
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
